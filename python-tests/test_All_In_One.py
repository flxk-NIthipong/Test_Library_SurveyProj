import os
import shutil
import re
import json
import pandas as pd
import docx
from fastapi import FastAPI, File, UploadFile
from google import genai
from google.genai import types
from PIL import Image
from dotenv import load_dotenv

# ==========================================
# 1. ตั้งค่าระบบและโหลด API Key
# ==========================================
load_dotenv() # ดึง.env
API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=API_KEY)

app = FastAPI()

print("="*75)
print("🚀 เริ่มต้นเซิร์ฟเวอร์ FastAPI (All-in-One: Excel, Word, Image)")
print("="*75)

# ==========================================
# 2. ฟังก์ชันช่วยสกัดตัวเลขและหน่วย (สำหรับ Excel/Word)
# ==========================================
def extract_value_and_unit(text):
    if pd.isna(text) or text is None or str(text).strip() == "":
        return None, None
    
    text = str(text).strip()
    match = re.match(r'([\d\.,]+)\s*(.*)', text)
    
    if match:
        num_str = match.group(1).replace(',', '')
        try:
            num = float(num_str)
            if num.is_integer(): num = int(num)
        except ValueError:
            num = None
            
        unit = match.group(2).strip()
        if not unit: unit = None
        return num, unit
    else:
        return None, None

# ==========================================
# 3. Endpoint หลักสำหรับรับไฟล์
# ==========================================
@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    file_name = file.filename
    extension = file_name.split(".")[-1].lower()
    temp_file_path = f"temp_uploaded_file.{extension}"
    
    print(f"\n📥 ได้รับไฟล์: {file_name} (ประเภท: {extension})")

    # บันทึกไฟล์ชั่วคราวลงเครื่อง
    with open(temp_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    extracted_data = []

    try:
        # 🟢 กรณีที่ 1: ไฟล์ Excel (Pandas)
        if extension in ["xlsx", "xls"]:
            print("⚙️ กำลังประมวลผลด้วย Pandas...")
            df = pd.read_excel(temp_file_path)
            
            if 'ชื่อวัสดุ' in df.columns:
                df['ชื่อวัสดุ'] = df['ชื่อวัสดุ'].astype(str).str.strip()
                df.loc[df['ชื่อวัสดุ'] == 'nan', 'ชื่อวัสดุ'] = None

            if 'จำนวน' in df.columns:
                extracted_qty = df['จำนวน'].apply(extract_value_and_unit)
                df['จำนวน'] = [res[0] for res in extracted_qty]
                df['หน่วยนับ'] = [res[1] for res in extracted_qty]

            if 'ราคาประมาณ' in df.columns:
                extracted_price = df['ราคาประมาณ'].apply(extract_value_and_unit)
                df['ราคา'] = [res[0] for res in extracted_price]
                df['หน่วยเงิน'] = [res[1] for res in extracted_price]
                df = df.drop(columns=['ราคาประมาณ'])

            cols_order = ['ลำดับ', 'ชื่อวัสดุ', 'จำนวน', 'หน่วยนับ', 'ราคา', 'หน่วยเงิน']
            df = df[[c for c in cols_order if c in df.columns]]
            df = df.astype(object).where(pd.notnull(df), None)
            extracted_data = df.to_dict(orient="records")

        # 🔵 กรณีที่ 2: ไฟล์ Word (python-docx)
        elif extension in ["docx"]:
            print("⚙️ กำลังประมวลผลด้วย python-docx...")
            doc = docx.Document(temp_file_path)
            if len(doc.tables) > 0:
                table = doc.tables[0] # สมมติว่าดึงจากตารางแรก
                headers = [cell.text.strip() for cell in table.rows[0].cells]
                
                for row in table.rows[1:]:
                    row_data = [cell.text.strip() for cell in row.cells]
                    if all(data == "" for data in row_data): continue
                    
                    row_dict = {}
                    for i in range(len(headers)):
                        key = headers[i] if i < len(headers) and headers[i] else f"Column_{i+1}"
                        val = row_data[i] if i < len(row_data) and row_data[i] else None
                        row_dict[key] = val

                    if 'จำนวน' in row_dict:
                        qty_val, qty_unit = extract_value_and_unit(row_dict.get('จำนวน'))
                        row_dict['จำนวน'] = qty_val
                        row_dict['หน่วยนับ'] = qty_unit

                    price_key = 'ราคา' if 'ราคา' in row_dict else ('ราคาประมาณ' if 'ราคาประมาณ' in row_dict else None)
                    if price_key:
                        price_val, price_unit = extract_value_and_unit(row_dict.get(price_key))
                        row_dict['ราคา'] = price_val
                        row_dict['หน่วยเงิน'] = price_unit
                        if price_key != 'ราคา': del row_dict[price_key]

                    ordered_dict = {
                        'ลำดับ': row_dict.get('ลำดับ'),
                        'ชื่อวัสดุ': row_dict.get('ชื่อวัสดุ'),
                        'จำนวน': row_dict.get('จำนวน'),
                        'หน่วยนับ': row_dict.get('หน่วยนับ'),
                        'ราคา': row_dict.get('ราคา'),
                        'หน่วยเงิน': row_dict.get('หน่วยเงิน')
                    }
                    extracted_data.append(ordered_dict)

        # 🟠 กรณีที่ 3: ไฟล์รูปภาพ (Gemini Vision API)
        elif extension in ["jpg", "jpeg", "png"]:
            print("⚙️ กำลังประมวลผลด้วย Gemini API...")
            img = Image.open(temp_file_path)
            prompt = """
            กรุณาดึงข้อมูลรายการวัสดุจากรูปภาพนี้ แล้วแปลงเป็น JSON Array 
            โดยแต่ละรายการต้องมี Key และ Data Type ดังต่อไปนี้เป๊ะๆ:
            - "ลำดับ" (Number)
            - "ชื่อวัสดุ" (String)
            - "จำนวน" (Number หรือ null ถ้าไม่มีข้อมูล)
            - "หน่วยนับ" (String หรือ null ถ้าไม่มีข้อมูล)
            - "ราคา" (Number หรือ null ถ้าไม่มีข้อมูล)
            - "หน่วยเงิน" (String หรือ null ถ้าไม่มีข้อมูล)
            """
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=[prompt, img],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.1
                )
            )
            extracted_data = json.loads(response.text)

        else:
            return {"status": "error", "message": "ไม่รองรับไฟล์ประเภทนี้ครับ"}

    except Exception as e:
        print(f"❌ Error ระหว่างประมวลผล: {e}")
        return {"status": "error", "message": str(e)}
        
    finally:
        # กวาดบ้าน: ลบไฟล์ชั่วคราวทิ้งทุกครั้งที่ประมวลผลเสร็จ เพื่อไม่ให้รกเซิร์ฟเวอร์
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

    print("✅ ประมวลผลสำเร็จและลบไฟล์ชั่วคราวแล้ว ส่ง JSON กลับไปที่หน้าเว็บ!")
    
    # ส่งข้อมูล JSON กลับไปให้ React 
    return {
        "status": "success",
        "file_type": extension,
        "data": extracted_data
    }