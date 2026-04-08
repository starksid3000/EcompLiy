package com.ecommerce.service;

import com.ecommerce.entity.Order;
import com.ecommerce.entity.OrderItem;
import com.ecommerce.entity.enums.OrderStatus;
import com.ecommerce.repository.OrderRepository;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.data.domain.Sort;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportService {

    private final OrderRepository orderRepository;
    private final JavaMailSender mailSender;

    @Value("${report.email.from}")
    private String emailFrom;

    @Value("${report.email.to}")
    private String emailTo;

    /**
     * Generate an Excel report for orders within a date range.
     * Mirrors NestJS's ExcelJS-based report generation.
     */
    public String generateOrdersReport(String startDateStr, String endDateStr, String status) throws IOException {
        LocalDateTime start;
        LocalDateTime end;

        if (startDateStr != null && endDateStr != null) {
            start = LocalDate.parse(startDateStr).atStartOfDay();
            end = LocalDate.parse(endDateStr).atTime(LocalTime.MAX);
        } else {
            // Default: yesterday
            LocalDate yesterday = LocalDate.now().minusDays(1);
            start = yesterday.atStartOfDay();
            end = yesterday.atTime(LocalTime.MAX);
        }

        // Fetch orders
        List<Order> orders = orderRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .filter(o -> !o.getCreatedAt().isBefore(start) && !o.getCreatedAt().isAfter(end))
                .filter(o -> status == null || status.equalsIgnoreCase("All") || o.getStatus().name().equalsIgnoreCase(status))
                .collect(Collectors.toList());

        // Build Excel workbook
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Orders");

        // -- Title Row (merged A1:F2) --
        sheet.addMergedRegion(new CellRangeAddress(0, 1, 0, 5));
        Row titleRow = sheet.createRow(0);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("EcompLiy - Daily Orders Report");

        CellStyle titleStyle = workbook.createCellStyle();
        Font titleFont = workbook.createFont();
        titleFont.setBold(true);
        titleFont.setFontHeightInPoints((short) 16);
        titleFont.setColor(IndexedColors.WHITE.getIndex());
        titleStyle.setFont(titleFont);
        titleStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        titleStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        titleStyle.setAlignment(HorizontalAlignment.CENTER);
        titleStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        titleCell.setCellStyle(titleStyle);

        // -- Subtitle Row (merged A3:F3) --
        sheet.addMergedRegion(new CellRangeAddress(2, 2, 0, 5));
        Row subtitleRow = sheet.createRow(2);
        Cell subtitleCell = subtitleRow.createCell(0);
        String statusLabel = status != null ? status : "All";
        subtitleCell.setCellValue(String.format("Report Generated: %s | Status: %s, Dates: %s to %s",
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")),
                statusLabel,
                start.toLocalDate(), end.toLocalDate()));

        CellStyle subtitleStyle = workbook.createCellStyle();
        Font subtitleFont = workbook.createFont();
        subtitleFont.setItalic(true);
        subtitleFont.setFontHeightInPoints((short) 10);
        subtitleStyle.setFont(subtitleFont);
        subtitleStyle.setAlignment(HorizontalAlignment.CENTER);
        subtitleCell.setCellStyle(subtitleStyle);

        // -- Header Row (row index 4) --
        String[] headers = {"Order ID", "Customer", "Total Amount", "Order Status", "Items", "Date"};
        Row headerRow = sheet.createRow(4);
        CellStyle headerStyle = workbook.createCellStyle();
        Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerFont.setColor(IndexedColors.WHITE.getIndex());
        headerStyle.setFont(headerFont);
        headerStyle.setFillForegroundColor(IndexedColors.GREY_50_PERCENT.getIndex());
        headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        headerStyle.setAlignment(HorizontalAlignment.CENTER);

        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        // -- Data Rows --
        int rowIndex = 5;
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        for (Order order : orders) {
            Row row = sheet.createRow(rowIndex);

            row.createCell(0).setCellValue(order.getId().toString());

            String customerName = "";
            if (order.getUser() != null) {
                String first = order.getUser().getFirstName() != null ? order.getUser().getFirstName() : "";
                String last = order.getUser().getLastName() != null ? order.getUser().getLastName() : "";
                customerName = (first + " " + last).trim();
            }
            row.createCell(1).setCellValue(customerName.isEmpty() ? "Guest" : customerName);

            Cell amountCell = row.createCell(2);
            amountCell.setCellValue(order.getTotalAmount().doubleValue());
            CellStyle currencyStyle = workbook.createCellStyle();
            currencyStyle.setDataFormat(workbook.createDataFormat().getFormat("\"$\"#,##0.00"));
            amountCell.setCellStyle(currencyStyle);

            row.createCell(3).setCellValue(order.getStatus().name());

            String itemsList = "";
            if (order.getOrderItems() != null) {
                itemsList = order.getOrderItems().stream()
                        .map(item -> "• " + item.getQuantity() + "x " +
                                (item.getProduct() != null ? item.getProduct().getName() : "Unknown"))
                        .collect(Collectors.joining("\n"));
            }
            row.createCell(4).setCellValue(itemsList);

            row.createCell(5).setCellValue(order.getCreatedAt().format(dtf));

            rowIndex++;
        }

        // Auto-size columns
        for (int i = 0; i < headers.length; i++) {
            sheet.setColumnWidth(i, i == 0 ? 10000 : i == 4 ? 15000 : 6000);
        }

        // Write to file
        File dir = new File("reports");
        if (!dir.exists()) {
            dir.mkdirs();
        }
        String filePath = "reports/orders-" + start.toLocalDate() + ".xlsx";
        try (FileOutputStream fos = new FileOutputStream(filePath)) {
            workbook.write(fos);
        }
        workbook.close();

        log.info("Generated report: {}", filePath);
        return filePath;
    }

    /**
     * Send the generated report via email. Mirrors NestJS's nodemailer integration.
     */
    public void sendEmail(String filePath) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);

        helper.setFrom(emailFrom);
        helper.setTo(emailTo);
        helper.setSubject("Daily Orders Report");
        helper.setText("Attached is yesterday's order report.");

        FileSystemResource file = new FileSystemResource(new File(filePath));
        helper.addAttachment("orders.xlsx", file);

        mailSender.send(message);
        log.info("Report email sent to {}", emailTo);
    }
}
