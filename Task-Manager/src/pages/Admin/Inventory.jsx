import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_PATHS } from "../../utils/apiPaths";
import axiosInstance from "../../utils/axiosInstance";
import * as XLSX from "xlsx";
import BarcodeScannerComponent from "react-qr-barcode-scanner";

const ITEMS_PER_PAGE = 5;

const Inventory = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [excelData, setExcelData] = useState([]);
  const [excelFile, setExcelFile] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [downloadFileName, setDownloadFileName] = useState("Inventory");
  const [searchTerm, setSearchTerm] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await axiosInstance.get(API_PATHS.INVENTORY.GET_ALL_PRODUCTS);
      setProducts(res.data);
    } catch (err) {
      console.error("Error fetching inventory:", err);
    }
  };

  const handleDetectedBarcode = async (barcode) => {
    if (barcode) {
      setScannedBarcode(barcode);
      setScanning(false);
      try {
        const res = await axiosInstance.get(`${API_PATHS.INVENTORY.GET_PRODUCT_BY_BARCODE}/${barcode}`);
        const products = res.data;

        const message = products
          .map((p, index) =>
            `#${index + 1}:\n` +
            `📦 Box Number: ${p.boxNumber}\n` +
            `🔢 Box Barcode: ${p.boxBarcode}\n` +
            `🧱 Pallet Barcode: ${p.palletBarcode}\n` +
            `🕒 Time: ${new Date(p.time).toLocaleString()}\n` +
            `📍 Status: ${p.status}\n` +
            `📌 Location: ${p.location || "N/A"}`
          )
          .join("\n------------------\n");

        alert(`✅ Barcode Scanned: ${barcode}\n\n${message}`);
      } catch (error) {
        console.error("Product(s) not found:", error);
        alert(`❌ No product(s) found for barcode: ${barcode}`);
      }
    }
  };

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    setExcelFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const workbook = XLSX.read(bstr, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      setExcelData(XLSX.utils.sheet_to_json(sheet));
    };
    reader.readAsBinaryString(file);
  };

  const handleInputChange = (index, field, value) => {
    const updated = [...excelData];
    updated[index][field] = value;
    setExcelData(updated);
  };

  const handleSave = async () => {
    try {
      await Promise.all(
        excelData.map(row =>
          axiosInstance.post(API_PATHS.INVENTORY.CREATE_PRODUCT, { ...row, location: row.location || "" })
        )
      );
      alert("Data saved successfully!");
      setExcelData([]);
      fetchInventory();
    } catch (err) {
      console.error("Error saving data:", err);
    }
  };

  const handleDownload = () => {
    const ws = XLSX.utils.json_to_sheet(products);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");
    XLSX.writeFile(wb, `${downloadFileName || "Inventory"}.xlsx`);
  };

  const handleReset = () => {
    setExcelData([]);
    setExcelFile(null);
    document.getElementById("excelFileInput").value = "";
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
    setCurrentPage(1);
  };

  const statusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "loaded": return { backgroundColor: "#28a745" };
      case "missing": return { backgroundColor: "#dc3545" };
      case "issue": return { backgroundColor: "#ffc107", color: "#000" };
      case "available": return { backgroundColor: "#17a2b8" };
      default: return { backgroundColor: "#6c757d" };
    }
  };

  const filteredProducts = searchTerm
    ? products.filter(p =>
        p.boxNumber?.toLowerCase().includes(searchTerm) ||
        p.boxBarcode?.toLowerCase().includes(searchTerm) ||
        p.palletBarcode?.toLowerCase().includes(searchTerm) ||
        new Date(p.time).toLocaleString().toLowerCase().includes(searchTerm) ||
        p.status?.toLowerCase().includes(searchTerm)
      )
    : products;

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
  <>
   
    <button onClick={() => navigate("/admin/dashboard")} style={{ marginBottom: "1rem", padding: "8px 12px", backgroundColor: "#007bff", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" }}>
      🔙 Back to Dashboard
    </button>
    <div
      style={{
        ...styles.container,
        display: "flex", flexWrap: "wrap", flexDirection: window.innerWidth < 768 ? "column" : "row",
        gap: "2rem",
        alignItems: "flex-start",
        minHeight: "100vh",
        boxSizing: "border-box",
      }}
    >
      {/* Left: Upload & Tables */}
      <div
        style={{
          flex: 2,
          paddingRight: "1rem",
          boxSizing: "border-box",
          minWidth: 0, // allow flex shrink
        }}
      >
        <h2 style={styles.title}>📦 Inventory Manager</h2>

        {/* Upload Section */}
        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>📁 Upload Excel</h3>
          <div style={styles.actions}>
            <label htmlFor="excelFileInput" style={styles.fileInputLabel}>
              📁 Choose Excel File
              <input
                id="excelFileInput"
                type="file"
                accept=".xlsx, .xls"
                onChange={handleExcelUpload}
                style={styles.hiddenFileInput}
              />
            </label>
            <span style={styles.fileName}>
              {excelFile ? excelFile.name : "No file selected"}
            </span>
            <input
              type="text"
              placeholder="Enter download file name"
              value={downloadFileName}
              onChange={(e) => setDownloadFileName(e.target.value)}
              style={styles.downloadNameInput}
            />
            <button style={styles.saveBtn} onClick={handleSave}>
              💾 Save
            </button>
            <button style={styles.downloadBtn} onClick={handleDownload}>
              ⬇️ Excel
            </button>
            <button style={styles.resetBtn} onClick={handleReset}>
              ♻️ Reset
            </button>
          </div>
        </div>

        {/* Editable Table for Uploaded Data */}
        {excelData.length > 0 && (
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}>✏️ Preview & Edit Uploaded Data</h3>
            <div style={{ overflowX: "auto", maxWidth: "100%" }}>
              <table style={{ ...styles.table, minWidth: 800 }}>
                <thead>
                  <tr>
                    {[
                      "boxNumber",
                      "boxBarcode",
                      "palletBarcode",
                      "time",
                      "status",
                      "location",
                    ].map((head, i) => (
                      <th key={i} style={styles.th}>
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {excelData.map((row, index) => (
                    <tr key={index}>
                      {[
                        "boxNumber",
                        "boxBarcode",
                        "palletBarcode",
                        "time",
                        "status",
                        "location",
                      ].map((field, i) => (
                        <td key={i} style={styles.td}>
                          <input
                            type="text"
                            value={row[field] || ""}
                            onChange={(e) =>
                              handleInputChange(index, field, e.target.value)
                            }
                            style={{
                              width: "100%",
                              padding: "4px",
                              border: "1px solid #ccc",
                              borderRadius: "4px",
                              boxSizing: "border-box",
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Records from DB */}
        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>📄 Existing Records from Database</h3>
          <input
            type="text"
            placeholder="🔍 Search by Box Number, Barcode, Status or Date"
            value={searchTerm}
            onChange={handleSearch}
            style={styles.searchBar}
          />
          <div style={{ overflowX: "auto", maxWidth: "100%" }}>
            <table style={{ ...styles.table, minWidth: 800 }}>
              <thead>
                <tr>
                  {[
                    "Box Number",
                    "Box Barcode",
                    "Pallet Barcode",
                    "Time",
                    "Status",
                    "Location",
                  ].map((head, i) => (
                    <th key={i} style={styles.th}>
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((product, index) => (
                  <tr key={index}>
                    <td style={styles.td}>{product.boxNumber}</td>
                    <td style={styles.td}>{product.boxBarcode}</td>
                    <td style={styles.td}>{product.palletBarcode}</td>
                    <td style={styles.td}>
                      {new Date(product.time).toLocaleString()}
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{ ...styles.statusTag, ...statusColor(product.status) }}
                      >
                        {product.status}
                      </span>
                    </td>
                    <td style={styles.td}>{product.location || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={styles.pagination}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
            >
              ⬅️ Prev
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next ➡️
            </button>
          </div>
        </div>
      </div>

      {/* Right: Barcode Scanner */}
      <div
        style={{
          flex: 1,
          minWidth: 320,
          paddingLeft: "1rem",
          boxSizing: "border-box",
          maxHeight: "calc(100vh - 64px)",
          position: "sticky",
          top: "1rem",
          alignSelf: "flex-start",
        }}
      >
        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>📷 Barcode Scanner</h3>
          <button
            style={{ ...styles.downloadBtn, width: "100%", marginBottom: "1rem" }}
            onClick={() => setScanning((prev) => !prev)}
          >
            {scanning ? "❌ Stop Scanner" : "📷 Start Scanner"}
          </button>
          {scanning && (
            <BarcodeScannerComponent
              width={320}
              height={240}
              onUpdate={(err, result) => {
                if (result) handleDetectedBarcode(result.text);
              }}
            />
          )}
          {scannedBarcode && !scanning && (
            <div
              style={{
                marginTop: "1rem",
                padding: "0.5rem",
                backgroundColor: "#e9ecef",
                borderRadius: "5px",
                fontSize: "14px",
              }}
            >
              <strong>Last Scanned Barcode:</strong> {scannedBarcode}
            </div>
          )}
        </div>
      </div>
    </div>
  </>
  );
};

const styles = {
  container: {
    padding: "2rem",
    fontFamily: "Segoe UI, sans-serif",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  title: {
    fontSize: "28px",
    marginBottom: "1.5rem",
    fontWeight: "bold",
    color: "#333",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    marginBottom: "1rem",
  },
  card: {
    backgroundColor: "#fff",
    padding: "1.5rem",
    borderRadius: "10px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    marginBottom: "2rem",
  },
  actions: {
    display: "flex", flexWrap: "wrap", flexDirection: window.innerWidth < 768 ? "column" : "row",
    gap: "1rem",
    flexWrap: "wrap",
    alignItems: "center",
  },
  saveBtn: {
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    padding: "8px 16px",
    borderRadius: "5px",
    cursor: "pointer",
  },
  downloadBtn: {
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    padding: "8px 16px",
    borderRadius: "5px",
    cursor: "pointer",
  },
  resetBtn: {
    backgroundColor: "#ffc107",
    color: "#000",
    border: "none",
    padding: "8px 16px",
    borderRadius: "5px",
    cursor: "pointer",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    backgroundColor: "#fff",
    border: "1px solid #ccc",
    textAlign: "left",
  },
  th: {
    border: "1px solid #ddd",
    padding: "10px",
    background: "#f1f1f1",
    textAlign: "left",
    whiteSpace: "nowrap",
  },
  td: {
    border: "1px solid #ddd",
    padding: "10px",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
  },
  fileInputLabel: {
    padding: "8px 16px",
    backgroundColor: "#6c757d",
    color: "#fff",
    borderRadius: "5px",
    cursor: "pointer",
    fontWeight: "500",
  },
  hiddenFileInput: {
    display: "none",
  },
  fileName: {
    fontSize: "14px",
    marginLeft: "10px",
  },
  downloadNameInput: {
    marginLeft: "10px",
    padding: "6px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    fontSize: "14px",
  },
  statusTag: {
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    color: "#fff",
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  pagination: {
    display: "flex", flexWrap: "wrap", flexDirection: window.innerWidth < 768 ? "column" : "row",
    justifyContent: "space-between",
    marginTop: "1rem",
    alignItems: "center",
    fontSize: "14px",
  },
  searchBar: {
    width: "100%",
    maxWidth: "400px",
    padding: "8px",
    marginBottom: "1rem",
    fontSize: "14px",
    border: "1px solid #ccc",
    borderRadius: "5px",
  },
};

export default Inventory;
