import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import workerSrc from "../../assets/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

const PdfViewer = ({ fileUrl }) => {
  const [numPages, setNumPages] = useState(null);

  const onDocumentLoadSuccess = ({ numPages }) => setNumPages(numPages);

  return (
    <div style={{ width: "100%", height: "100%", overflow: "auto", border: "1px solid #ccc" }}>
      <Document file={fileUrl} onLoadSuccess={onDocumentLoadSuccess}>
        {Array.from(new Array(numPages || 0), (_, index) => (
          <Page
            key={`page_${index + 1}`}
            pageNumber={index + 1}
            width={Math.min(600, window.innerWidth - 40)}
          />
        ))}
      </Document>
    </div>
  );
};

export default PdfViewer;
