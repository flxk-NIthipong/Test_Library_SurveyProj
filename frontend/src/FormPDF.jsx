import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// 🌟 1. ตั้งค่าฟอนต์ภาษาไทย (แก้ไขให้เว้นวรรคตรงกับชื่อไฟล์จริงใน Windows)
Font.register({
  family: 'THSarabun',
  fonts: [
    { src: '/fonts/THSarabunNew.ttf' }, // ไฟล์ปกติ
    { src: '/fonts/THSarabunNew Bold.ttf', fontWeight: 'bold' } // ไฟล์ตัวหนา (แก้ไขชื่อให้ตรง)
  ]
});

// 🌟 2. สไตล์ของเอกสาร (ปรับปรุงเพื่อรองรับแถว Total)
const styles = StyleSheet.create({
  page: { paddingTop: 40, paddingBottom: 40, paddingLeft: 50, paddingRight: 40, fontFamily: 'THSarabun', fontSize: 16 },
  headerRight: { textAlign: 'right', fontSize: 14, marginBottom: 10 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  section: { marginBottom: 5 },
  row: { flexDirection: 'row' },
  boldText: { fontWeight: 'bold' },
  
  // สไตล์ตาราง
  table: { display: 'table', width: 'auto', borderStyle: 'solid', borderWidth: 1, borderColor: '#000', marginBottom: 10 },
  tableRow: { flexDirection: 'row' },
  tableHeader: { backgroundColor: '#f0f0f0', fontWeight: 'bold', textAlign: 'center' },
  tableCol: { borderStyle: 'solid', borderWidth: 1, borderColor: '#000', borderTopWidth: 0, borderLeftWidth: 0 },
  tableCell: { margin: 5, fontSize: 14, textAlign: 'center' },
  tableCellLeft: { margin: 5, fontSize: 14, textAlign: 'left' },

  // สไตล์สำหรับแถวราคารวม (Total)
  grandTotalRow: { backgroundColor: '#f9f9f9', fontWeight: 'bold' },
  // คอลัมน์ป้ายกำกับ (ยุบ 3 คอลัมน์แรก) = 10% + 40% + 20% = 70%
  grandTotalLabelCol: { width: '70%', borderStyle: 'solid', borderWidth: 1, borderColor: '#000', borderTopWidth: 0, borderLeftWidth: 0, textAlign: 'center', backgroundColor: '#f9f9f9' },
  // คอลัมน์แสดงราคา (ยุบ 2 คอลัมน์หลัง) = 15% + 15% = 30%
  grandTotalValueCol: { width: '30%', borderStyle: 'solid', borderWidth: 1, borderColor: '#000', borderTopWidth: 0, borderLeftWidth: 0, textAlign: 'right', backgroundColor: '#f9f9f9' },
  tableCellCenterBold: { margin: 5, fontSize: 14, textAlign: 'center', fontWeight: 'bold' },
  tableCellRightBold: { margin: 5, fontSize: 14, textAlign: 'right', fontWeight: 'bold', marginRight: 15 }, // เว้นขวาหน่อยสวยๆ

  // ความกว้างคอลัมน์ปกติ
  col1: { width: '10%' }, // ลำดับที่
  col2: { width: '40%' }, // รายการ
  col3: { width: '20%' }, // จำนวน(หน่วยนับ)
  col4: { width: '15%' }, // ราคาประเมิน
  col5: { width: '15%' }, // หมายเหตุ

  footerText: { marginTop: 10, marginLeft: 20 }
});

// 🌟 3. Component หลักสำหรับสร้าง PDF
const FormPDF = ({ data }) => {
  
  // คำนวณราคารวมทั้งหมดสุทธิ (Grand Total) ของข้อมูลทุกรายการ
  const grandTotal = data.reduce((sum, item) => {
    // ตรวจสอบค่าก่อนคำนวณ กันบั๊กข้อมูลว่าง
    const price = parseFloat(item.ราคา) || 0;
    const quantity = parseFloat(item.จำนวน) || 0;
    return sum + (price * quantity);
  }, 0);

  // ฟังก์ชันแบ่งข้อมูลเป็นก้อนๆ (หน้าละ 10 รายการ)
  const chunkedData = [];
  for (let i = 0; i < data.length; i += 10) {
    chunkedData.push(data.slice(i, i + 10));
  }

  return (
    <Document>
      {chunkedData.map((chunk, pageIndex) => (
        <Page key={pageIndex} size="A4" style={styles.page}>
          
          {/* 🟢 แสดงหัวกระดาษเฉพาะหน้าแรกเท่านั้น */}
          {pageIndex === 0 && (
            <View>
              <Text style={styles.headerRight}>QF-FS-309-01</Text>
              <Text style={styles.title}>บันทึกข้อความ</Text>
              <Text style={styles.section}><Text style={styles.boldText}>ส่วนงาน....</Text> ศูนย์การศึกษาวิทยาการสาขา... คณะวิศวกรรมศาสตร์... มหาวิทยาลัยเชียงใหม่</Text>
              <Text style={styles.section}><Text style={styles.boldText}>ที่</Text> อว 8393(14).9(4) / ........................ <Text style={styles.boldText}>วันที่</Text> .....................................................</Text>
              <View style={{ borderBottom: '1px solid black', marginVertical: 10 }} />
              <Text style={styles.section}><Text style={styles.boldText}>เรียน</Text> คณบดี</Text>
              <Text style={[styles.section, { textIndent: 40 }]}>
                ด้วย ศูนย์การศึกษาวิทยาการสาขา มีความจำเป็นที่จะต้องใช้วัสดุ โครงการ (ชื่อโครงการ) ........................................................................................ จำนวน ............ รายการ
              </Text>
              <Text style={[styles.section, { textIndent: 40, marginBottom: 15 }]}>
                เพื่อ (เหตุผลการใช้)  [  ] ใช้ในการเรียนการสอน  [  ] ใช้ในงานสำนักงาน  [  ] พัฒนาระบบสารสนเทศและฐานข้อมูล  [  ] อื่นๆ ...........
              </Text>
            </View>
          )}

          {/* 🟢 ส่วนของตาราง */}
          <View style={styles.table}>
            {/* หัวตาราง */}
            <View style={[styles.tableRow, styles.tableHeader]}>
              <View style={[styles.tableCol, styles.col1]}><Text style={styles.tableCell}>ลำดับที่</Text></View>
              <View style={[styles.tableCol, styles.col2]}><Text style={styles.tableCell}>รายการ</Text></View>
              <View style={[styles.tableCol, styles.col3]}><Text style={styles.tableCell}>จำนวน (หน่วยนับ)</Text></View>
              <View style={[styles.tableCol, styles.col4]}><Text style={styles.tableCell}>ราคาโดยประมาณ</Text></View>
              <View style={[styles.tableCol, styles.col5]}><Text style={styles.tableCell}>หมายเหตุ</Text></View>
            </View>

            {/* ข้อมูลในตาราง (10 รายการ) */}
            {chunk.map((item, index) => {
              // คำนวณราคารวม (ถ้ามี) ไว้ใส่ในช่องหมายเหตุ
              const totalPrice = (item.ราคา && item.จำนวน) ? (item.ราคา * item.จำนวน).toLocaleString() : '';
              
              return (
                <View style={styles.tableRow} key={index}>
                  {/* แสดงลำดับสะสมข้ามหน้า */}
                  <View style={[styles.tableCol, styles.col1]}><Text style={styles.tableCell}>{(pageIndex * 10) + index + 1}</Text></View>
                  <View style={[styles.tableCol, styles.col2]}><Text style={styles.tableCellLeft}>{item.ชื่อวัสดุ || '-'}</Text></View>
                  <View style={[styles.tableCol, styles.col3]}><Text style={styles.tableCell}>{`${item.จำนวน || '-'} ${item.หน่วยนับ || ''}`}</Text></View>
                  <View style={[styles.tableCol, styles.col4]}><Text style={styles.tableCell}>{item.ราคา ? item.ราคา.toLocaleString() : '-'}</Text></View>
                  <View style={[styles.tableCol, styles.col5]}><Text style={styles.tableCell}>{totalPrice || '-'}</Text></View>
                </View>
              );
            })}

            {/* เพิ่มบรรทัดสรุปราคาทั้งหมด (เฉพาะหน้าสุดท้ายเท่านั้น) */}
            {pageIndex === chunkedData.length - 1 && (
              <View style={[styles.tableRow, styles.grandTotalRow]}>
                {/* คอลัมน์ป้ายกำกับ ยุบรวมคอลัมน์ 1-3 */}
                <View style={styles.grandTotalLabelCol}>
                  <Text style={styles.tableCellCenterBold}>ราคาทั้งหมดสุทธิ (บาท)</Text>
                </View>
                {/* คอลัมน์แสดงราคา ยุบรวมคอลัมน์ 4-5 */}
                <View style={styles.grandTotalValueCol}>
                  <Text style={styles.tableCellRightBold}>
                    {/* แสดงทศนิยม 2 ตำแหน่ง พร้อมคอมมา */}
                    {grandTotal.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* 🟢 แสดงท้ายกระดาษ (ผู้เซ็นรับ) เฉพาะหน้าสุดท้ายเท่านั้น */}
          {pageIndex === chunkedData.length - 1 && (
            <View style={{ marginTop: 20 }}>
              <Text style={styles.section}>พร้อมนี้ขอเสนอแต่งตั้ง ดังนี้</Text>
              <Text style={styles.footerText}>1. ผู้จัดทำร่างขอบเขตงาน คือ [  ] ....................................................................</Text>
              <Text style={styles.footerText}>2. ผู้กำหนดราคากลาง คือ [  ] ...........................................................................</Text>
              <Text style={styles.footerText}>3. ผู้ตรวจรับพัสดุ คือ [  ] ................................................................................</Text>
            </View>
          )}

          {/* ใส่เลขหน้าตรงมุมขวาล่าง */}
          <Text style={{ position: 'absolute', bottom: 20, right: 40, fontSize: 12, fontFamily: 'THSarabun' }}>
            หน้า {pageIndex + 1} / {chunkedData.length}
          </Text>
        </Page>
      ))}
    </Document>
  );
};

export default FormPDF;