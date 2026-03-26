import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import FormPDF from './FormPDF'; 
import './App.css'; 

function UploadPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // =================================================================
  // อ่าน job_id จาก URL และดึงข้อมูลจาก Python
  // =================================================================
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get('job_id');

    if (jobId) {
      console.log("🔍 พบ Job ID จาก LINE:", jobId);
      setLoading(true);
      
      // ยิง API ไปขอข้อมูลที่ Python เตรียมไว้
      axios.get(`http://127.0.0.1:8000/api/get-job/${jobId}`)
        .then(response => {
          if (response.data.status === 'success') {
            setData(response.data.data);
          } else {
            setError(response.data.message || "ไม่พบข้อมูลจาก LINE");
          }
        })
        .catch(err => {
          console.error("API Error:", err);
          setError("ไม่สามารถดึงข้อมูลจาก Server ได้");
        })
        .finally(() => {
          setLoading(false);
          window.history.replaceState(null, '', window.location.pathname);
        });
    }
  }, []); 


  // =================================================================
  // จัดการคำผิด
  // =================================================================
  const handleSelectSuggestion = (index, newName) => {
    const newData = [...data];
    newData[index].ชื่อวัสดุ = newName;
    newData[index].สถานะ = 'correct'; 
    setData(newData);
  };

  // =================================================================
  // อัปโหลดไฟล์แบบลากวาง
  // =================================================================
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setData([]); 

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://127.0.0.1:8000/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      if (response.data.status === 'success') {
        setData(response.data.data);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('ไม่สามารถติดต่อ Server ได้');
    } finally {
      setLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false });

  const getStatusColor = (status) => {
    switch (status) {
      case 'correct': return '#e8f5e9'; 
      case 'warning': return '#fff3e0'; 
      case 'error': return '#fff9c4';   
      default: return '#ffffff';
    }
  };

  return (
    <div className="App" style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#1976d2' }}>🚀 ระบบสกัดข้อมูลวัสดุ</h1>
      
      {/* แสดงข้อความ Error แจ้งเตือนถ้ามีปัญหา */}
      {error && (
        <div style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '5px', marginBottom: '20px', textAlign: 'center' }}>
          ❌ {error}
        </div>
      )}

      <div {...getRootProps()} style={{
        border: '2px dashed #1976d2',
        borderRadius: '10px',
        padding: '30px',
        textAlign: 'center',
        backgroundColor: isDragActive ? '#e3f2fd' : '#fafafa',
        cursor: 'pointer',
        marginBottom: '20px'
      }}>
        <input {...getInputProps()} />
        {loading ? <p>⏳ กำลังประมวลผล...</p> : <p>ลากไฟล์มาวางที่นี่เพื่อเริ่มทำงาน</p>}
      </div>

      {data.length > 0 && (
        <div style={{ marginBottom: '40px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#1976d2', color: 'white' }}>
                <th style={styles.th}>ลำดับ</th>
                <th style={styles.th}>ชื่อวัสดุ</th>
                <th style={styles.th}>จำนวน</th>
                <th style={styles.th}>หน่วยนับ</th>
                <th style={styles.th}>ราคา</th>
                <th style={styles.th}>หน่วยเงิน</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={index} style={{ backgroundColor: getStatusColor(item.สถานะ) }}>
                  <td style={styles.td}>{item.ลำดับ || index + 1}</td>
                  <td style={styles.td}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{item.ชื่อวัสดุ}</div>
                    
                    {/* ปุ่มตัวเลือก Suggestions */}
                    {item.สถานะ !== 'correct' && item.suggestions?.length > 0 && (
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                        {item.suggestions.map((suggest) => (
                          <button key={suggest} onClick={() => handleSelectSuggestion(index, suggest)} style={styles.suggestBtn}>
                            {suggest}
                          </button>
                        ))}
                        <button onClick={() => handleSelectSuggestion(index, item.ชื่อวัสดุ)} style={{ ...styles.suggestBtn, color: '#666', borderColor: '#ccc' }}>
                          ใช้คำเดิม
                        </button>
                      </div>
                    )}
                  </td>
                  <td style={styles.td}>{item.จำนวน || '-'}</td>
                  <td style={styles.td}>{item.หน่วยนับ || '-'}</td>
                  <td style={styles.td}>{item.ราคา ? item.ราคา.toLocaleString() : '-'}</td>
                  <td style={styles.td}>{item.หน่วยเงิน || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <PDFDownloadLink
            document={<FormPDF data={data} />}
            fileName="บันทึกข้อความ_จัดซื้อวัสดุ.pdf"
            style={{
              textDecoration: 'none',
              padding: '12px 25px',
              color: '#fff',
              backgroundColor: '#2e7d32',
              border: 'none',
              borderRadius: '5px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              display: 'inline-block', 
              marginTop: '40px'    
            }}
          >
            {({ loading }) => (loading ? '⏳ กำลังเตรียมไฟล์...' : '📥 ดาวน์โหลดไฟล์ PDF (Export)')}
          </PDFDownloadLink>
        </div>
      )}

      {data.length > 0 && !loading && (
        <div style={{ height: '1200px', border: '2px solid #555', marginBottom:"100px" }}>
          <PDFViewer width="100%" height="100%">
            <FormPDF data={data} />
          </PDFViewer>
        </div>
      )}
    </div>
  );
}

const styles = {
  th: { padding: '12px', border: '1px solid #ddd', textAlign: 'left' },
  td: { padding: '12px', border: '1px solid #ddd', verticalAlign: 'top' },
  suggestBtn: {
    padding: '2px 8px',
    fontSize: '12px',
    cursor: 'pointer',
    backgroundColor: '#fff',
    border: '1px solid #1976d2',
    color: '#1976d2',
    borderRadius: '4px'
  }
};

export default UploadPage;