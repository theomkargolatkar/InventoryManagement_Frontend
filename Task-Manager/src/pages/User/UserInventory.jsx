
import React, { useEffect, useState } from "react";
import { API_PATHS } from "../../utils/apiPaths";
import axiosInstance from "../../utils/axiosInstance";
import { useNavigate } from "react-router-dom";

const UserInventory = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [editedProducts, setEditedProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await axiosInstance.get(API_PATHS.INVENTORY.GET_ALL_PRODUCTS);
      setProducts(res.data);
      setEditedProducts(res.data.map((product) => ({ ...product })));
    } catch (err) {
      console.error("Error fetching inventory:", err);
    }
  };

  const handleInputChange = (index, field, value) => {
    const updated = [...editedProducts];
    updated[index][field] = value;
    setEditedProducts(updated);
  };

  const handleUpdate = async (id, data) => {
    const payload = {
      boxNumber: data.boxNumber,
      boxBarcode: data.boxBarcode,
      palletBarcode: data.palletBarcode,
      time: data.time,
      status: data.status,
      location: data.location || "",
    };

    try {
      await axiosInstance.put(API_PATHS.INVENTORY.UPDATE_PRODUCT(id), payload);
      alert("Product updated successfully!");
      fetchInventory();
    } catch (err) {
      console.error("Error updating product:", err.response?.data || err);
      alert("Failed to update product");
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const filteredProducts = searchTerm
    ? editedProducts.filter((p) => p.boxNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    : editedProducts;

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const currentItems = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const changePage = (direction) => {
    if (direction === "next" && currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    } else if (direction === "prev" && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <>
      <button
        onClick={() => navigate("/user/dashboard")}
        style={{
          margin: "1rem 0",
          padding: "8px 12px",
          backgroundColor: "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        🔙 Back to Dashboard
      </button>

      <div style={styles.container}>
        <h2 style={styles.title}>📋 Update Inventory (User)</h2>

        <input
          type="text"
          placeholder="🔍 Search by Box Number..."
          value={searchTerm}
          onChange={handleSearch}
          style={styles.searchBar}
        />

        <div style={styles.card}>
          <div style={styles.scrollContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Box Number</th>
                  <th>Box Barcode</th>
                  <th>Pallet Barcode</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Location</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((product, index) => (
                  <tr key={product._id}>
                    {["boxNumber", "boxBarcode", "palletBarcode", "time", "status", "location"].map((field) => (
                      <td key={field}>
                        <input
                          type="text"
                          value={product[field] || ""}
                          onChange={(e) => handleInputChange(index, field, e.target.value)}
                          style={styles.input}
                        />
                      </td>
                    ))}
                    <td>
                      <button
                        onClick={() => handleUpdate(product._id, product)}
                        style={styles.updateBtn}
                      >
                        Save
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!searchTerm && (
              <div style={styles.pagination}>
                <button disabled={currentPage === 1} onClick={() => changePage("prev")}>
                  ◀ Prev
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button disabled={currentPage === totalPages} onClick={() => changePage("next")}>
                  Next ▶
                </button>
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
    padding: "1rem",
    fontFamily: "Segoe UI, sans-serif",
    maxWidth: "100%",
    overflowX: "auto",
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    marginBottom: "1rem",
    color: "#333",
    textAlign: "center",
  },
  searchBar: {
    padding: "8px",
    marginBottom: "1rem",
    width: "100%",
    maxWidth: "300px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    fontSize: "14px",
  },
  card: {
    backgroundColor: "#fff",
    padding: "1rem",
    borderRadius: "10px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    marginBottom: "2rem",
  },
  scrollContainer: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    backgroundColor: "#fff",
    borderRadius: "6px",
    overflow: "hidden",
    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
    minWidth: "800px",
  },
  input: {
    width: "100%",
    padding: "6px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  updateBtn: {
    backgroundColor: "#28a745",
    color: "#fff",
    padding: "4px 10px",
    fontSize: "13px",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
  },
  pagination: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "1rem",
    fontSize: "14px",
    flexWrap: "wrap",
    gap: "0.5rem",
  },
};

export default UserInventory;
