import PdfViewer from "./PdfViewer";
import samplePDF from "../../assets/sample-invoice.pdf?url";

export default function TestPdfViewer() {
  return (
    <div style={{ width: "100%", height: "80vh" }}>
      <h2>Test PDFViewer</h2>
      <PdfViewer fileUrl={samplePDF} />
    </div>
  );
}
