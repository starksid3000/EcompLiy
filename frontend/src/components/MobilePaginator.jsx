import { Button } from "primereact/button";

const MobilePaginator = ({ first, rows, totalRecords, onPageChange }) => {
  const currentPage = Math.floor(first / rows) + 1;
  const totalPages = Math.ceil(totalRecords / rows);

  return (
    <div className="flex align-items-center justify-content-between gap-2 block md:hidden w-full">
      <Button
        icon="pi pi-chevron-left"
        className="p-button-rounded p-button-outlined p-button-sm"
        disabled={first === 0}
        onClick={() =>
          onPageChange({ first: Math.max(0, first - rows), rows })
        }
      />

      <span className="text-600 font-semibold text-sm">
        Page {currentPage} of {totalPages}
      </span>

      <Button
        icon="pi pi-chevron-right"
        className="p-button-rounded p-button-outlined p-button-sm"
        disabled={first + rows >= totalRecords}
        onClick={() =>
          onPageChange({ first: first + rows, rows })
        }
      />
    </div>
  );
};

export default MobilePaginator;