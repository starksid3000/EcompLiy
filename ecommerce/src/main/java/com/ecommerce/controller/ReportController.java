package com.ecommerce.controller;

import com.ecommerce.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.mail.MessagingException;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/report")
@RequiredArgsConstructor
@Tag(name = "report")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/download")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Download Orders Report (Excel)")
    public ResponseEntity<Resource> download(
            @RequestParam(value = "startDate", required = false) String startDate,
            @RequestParam(value = "endDate", required = false) String endDate,
            @RequestParam(value = "status", required = false) String status
    ) throws IOException {
        String filePath = reportService.generateOrdersReport(startDate, endDate, status);
        File file = new File(filePath);
        FileSystemResource resource = new FileSystemResource(file);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getName() + "\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(resource);
    }

    @GetMapping("/run-report")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Generate & Send Yesterday's Orders Report via Email")
    public ResponseEntity<Map<String, String>> runReport() throws IOException, MessagingException {
        String filePath = reportService.generateOrdersReport(null, null, null);
        reportService.sendEmail(filePath);
        return ResponseEntity.ok(Map.of("message", "Report generated & sent"));
    }
}
