import pandas as pd
import re

print("="*75)
print("📊 เริ่มการทดสอบ Pandas ")
print("="*75)

file_name = "../MockData/excel_MockData.xlsx"

# =====================================================================
# 2. ฟังก์ชันผ่าตัดแยก "ตัวเลข" และ "หน่วย" ด้วย Regex 
# =====================================================================
def extract_value_and_unit(text):
    # ถ้าไม่มีข้อมูลเลย ให้คืนค่าเป็น None ทั้งตัวเลขและหน่วย
    if pd.isna(text) or str(text).strip() == "":
        return None, None
    
    text = str(text).strip()
    match = re.match(r'([\d\.,]+)\s*(.*)', text)
    
    if match:
        num_str = match.group(1).replace(',', '')
        try:
            num = float(num_str)
            # ทำให้เป็นจำนวนเต็มถ้าลงตัว (เช่น 5.0 -> 5)
            if num.is_integer():
                num = int(num)
        except ValueError:
            num = None  # หาตัวเลขไม่เจอ ให้เป็น None
            
        unit = match.group(2).strip()
        if not unit:
            unit = None # หาหน่วยไม่เจอ ให้เป็น None
            
        return num, unit
    else:
        # กรณีพิมพ์แต่ตัวอักษรมั่วๆ ไม่มีตัวเลขเลย
        return None, None

# =====================================================================
# 3. ส่วนหลัก: อ่านไฟล์และสกัดข้อมูล
# =====================================================================
try:
    print(f"📥 กำลังโหลดข้อมูลจากไฟล์: '{file_name}'...")
    
    df = pd.read_excel(file_name)

    # คลีนชื่อวัสดุ
    if 'ชื่อวัสดุ' in df.columns:
        df['ชื่อวัสดุ'] = df['ชื่อวัสดุ'].astype(str).str.strip()
        df.loc[df['ชื่อวัสดุ'] == 'nan', 'ชื่อวัสดุ'] = None

    # ผ่าตัดคอลัมน์ "จำนวน"
    if 'จำนวน' in df.columns:
        extracted_qty = df['จำนวน'].apply(extract_value_and_unit)
        df['จำนวน'] = [res[0] for res in extracted_qty]
        df['หน่วยนับ'] = [res[1] for res in extracted_qty]

    # ผ่าตัดคอลัมน์ "ราคาประมาณ"
    if 'ราคาประมาณ' in df.columns:
        extracted_price = df['ราคาประมาณ'].apply(extract_value_and_unit)
        df['ราคา'] = [res[0] for res in extracted_price]
        df['หน่วยเงิน'] = [res[1] for res in extracted_price]
        df = df.drop(columns=['ราคาประมาณ'])

    # จัดเรียงคอลัมน์ใหม่
    cols_order = ['ลำดับ', 'ชื่อวัสดุ', 'จำนวน', 'หน่วยนับ', 'ราคา', 'หน่วยเงิน']
    df = df[[c for c in cols_order if c in df.columns]]

    # ---------------------------------------------------------
    # 🧠 จุดสำคัญที่สุด: แปลงช่องว่างทั้งหมดให้เป็น None แท้ๆ
    # ---------------------------------------------------------
    df = df.where(pd.notnull(df), None)

    print("\n📋 ตารางข้อมูลดิบ :")
    print(df.to_string(index=False))

    # แปลงเป็น JSON
    print("\n📦 ข้อมูล JSON :")
    json_data = df.to_dict(orient="records")

    for item in json_data:
        print(f"   {item}")

    print("\n✅ เสร็จสมบูรณ์! ข้อมูลคลีน")

except FileNotFoundError:
    print(f"❌ Error: หาไฟล์ '{file_name}' ไม่เจอ! ลองเช็คตำแหน่งไฟล์ดูอีกครั้ง")
except Exception as e:
    print(f"❌ Error: เกิดข้อผิดพลาด -> {e}")

print("="*75)