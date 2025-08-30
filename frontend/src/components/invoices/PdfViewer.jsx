import { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button, ButtonGroup } from "react-bootstrap";
import workerSrc from "../../assets/pdf.worker.min.mjs?url";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

const PdfViewer = ({ fileUrl, invoiceId }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) setWidth(containerRef.current.clientWidth);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const onDocumentLoadError = (err) => {
    console.error("Erreur de chargement du PDF:", err);
    console.log("Nom du fichier PDF transmis:", fileUrl);
    setError('Erreur de chargement du PDF');
  };

  if (!fileUrl) return <div>Aucun PDF disponible</div>;

  return (
    <div ref={containerRef} className="d-flex flex-column" style={{ width: "100%", height: "100%", border: "1px solid #ccc" }}>
      
      {/* Contrôles PDF */}
      <div className="d-flex justify-content-between align-items-center mb-2 p-2 bg-light border-bottom">
        {/* Navigation */}
        <ButtonGroup size="sm">
          <Button onClick={() => setPageNumber(p => Math.max(p - 1, 1))} disabled={pageNumber <= 1}>⬅️</Button>
          <Button variant="light" disabled>{pageNumber} / {numPages || "?"}</Button>
          <Button onClick={() => setPageNumber(p => Math.min(p + 1, numPages))} disabled={pageNumber >= numPages}>➡️</Button>
        </ButtonGroup>

        {/* Zoom */}
        <ButtonGroup size="sm">
          <Button onClick={() => setScale(s => Math.max(s - 0.1, 0.1))}>–</Button>
          <Button variant="light" disabled>{Math.round(scale * 100)}%</Button>
          <Button onClick={() => setScale(s => s + 0.1)}>+</Button>
        </ButtonGroup>

        {/* Téléchargement */}
        <Button href={fileUrl} target="_blank" download={`facture_${invoiceId || "unknown"}.pdf`} variant="success" size="sm">
          Télécharger ⬇️
        </Button>
      </div>

      {/* PDF */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {error && <div className="text-danger p-2">{error}</div>}
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
        >
          <Page pageNumber={pageNumber} width={width} scale={scale} />
        </Document>
      </div>
    </div>
  );
};

export default PdfViewer;
