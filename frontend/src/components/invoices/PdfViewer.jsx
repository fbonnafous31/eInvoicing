import { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import workerSrc from "../../assets/pdf.worker.min.mjs?url";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

const PdfViewer = ({ fileUrl }) => {
  const [numPages, setNumPages] = useState(null);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (containerRef.current) {
      setWidth(containerRef.current.clientWidth);
    }

    const handleResize = () => {
      if (containerRef.current) setWidth(containerRef.current.clientWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const onDocumentLoadSuccess = ({ numPages }) => setNumPages(numPages);
  const onDocumentLoadError = (err) => {
    console.error("Erreur de chargement du PDF:", err);
    console.log("Nom du fichier PDF transmis:", fileUrl);
    setError('Erreur de chargement du PDF');
  };

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", overflow: "auto", border: "1px solid #ccc" }}
    >
      {error && <div>{error}</div>}
      <Document
        file={fileUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
      >
        {Array.from(new Array(numPages || 0), (_, index) => (
          <Page
            key={`page_${index + 1}`}
            pageNumber={index + 1}
            width={width} 
          />
        ))}
      </Document>
    </div>
  );
};

export default PdfViewer;
