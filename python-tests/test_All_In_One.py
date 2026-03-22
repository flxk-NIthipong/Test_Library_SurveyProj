import os
import io
import json
import re 
import pandas as pd
import docx
import google.generativeai as genai
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from thefuzz import process
import PIL.Image

# =================================================================
# 🔑 1. ตั้งค่า Gemini API
# =================================================================
genai.configure(api_key=os.environ.get("GEMINI_API_KEY")) # หรือใส่ API Key 

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =================================================================
# 🗄️ 2. ฐานข้อมูลวัสดุมาตรฐาน (แก้คำผิด)
# =================================================================
STANDARD_MATERIALS = [
    "สายไฟ VAF 2x2.5", "สกรูเกลียวปล่อย หัว F เบอร์ 7 ยาว 2 นิ้ว", "ท่อ PVC 2 นิ้ว ชั้น 8.5",
    "เทปพันสายไฟ 3M", "สีทาบ้าน สีขาว", "หลอดไฟ LED 18W", "ปูนซีเมนต์ผสม ตราเสือ",
    "กระดาษทรายขัดไม้ เบอร์ 1", "ถุงมือผ้าเคลือบยาง", "ค้อนหงอนด้ามไฟเบอร์", "น็อตตัวเมีย M8",
    "ซิลิโคนใส กันน้ำ", "ใบตัดเหล็ก 4 นิ้ว", "สายยางรดน้ำ 5 หุน", "กาวลาเท็กซ์ TOA", "แปรงทาสี 2 นิ้ว"
]

# =================================================================
# 📥 3. API สำหรับรับไฟล์และสกัดข้อมูล
# =================================================================
@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    try:
        filename = file.filename.lower()
        content = await file.read()
        extracted_data = []

        print(f"\n📥 ได้รับไฟล์: {filename}")

        # ---------------------------------------------------------
        # 🟢 กรณีที่ 1: ไฟล์ Excel
        # ---------------------------------------------------------
        if filename.endswith(('.xlsx', '.xls')):
            print("⚙️ กำลังประมวลผลด้วย Pandas...")
            df = pd.read_excel(io.BytesIO(content))
            df = df.astype(object).where(pd.notnull(df), None) 
            raw_data = df.to_dict(orient="records")
            
            # 🌟 แปลงโครงสร้างและดึงคอลัมน์ "ราคาประมาณ" 
            for row in raw_data:
                item = {
                    "ลำดับ": row.get("ลำดับ"),
                    "ชื่อวัสดุ": row.get("ชื่อวัสดุ"),
                    "จำนวน": row.get("จำนวน"), 
                    "หน่วยนับ": None,
                    "ราคา": row.get("ราคาประมาณ") or row.get("ราคา"), 
                    "หน่วยเงิน": None
                }
                extracted_data.append(item)

        # ---------------------------------------------------------
        # 🔵 กรณีที่ 2: ไฟล์ Word
        # ---------------------------------------------------------
        elif filename.endswith('.docx'):
            print("⚙️ กำลังประมวลผลด้วย python-docx...")
            doc = docx.Document(io.BytesIO(content))
            
            if doc.tables:
                table = doc.tables[0]
                num_cols = len(table.rows[0].cells)
                for row in table.rows[1:]: 
                    cells = [cell.text.strip() for cell in row.cells]
                    if num_cols == 5:
                        row_data = {
                            "ลำดับ": cells[0], "ชื่อวัสดุ": cells[1], "จำนวน": cells[2],
                            "หน่วยนับ": None, "ราคา": cells[3], "หน่วยเงิน": None
                        }
                    else:
                        keys = ['ลำดับ', 'ชื่อวัสดุ', 'จำนวน', 'หน่วยนับ', 'ราคา', 'หน่วยเงิน']
                        row_data = {keys[i]: (cells[i] if i < len(cells) else None) for i in range(len(keys))}
                    extracted_data.append(row_data)

        # ---------------------------------------------------------
        # 🟠 กรณีที่ 3: รูปภาพ (Gemini)
        # ---------------------------------------------------------
        elif filename.endswith(('.png', '.jpg', '.jpeg')):
            print("⚙️ กำลังส่งรูปภาพให้ Gemini API อ่าน...")
            image = PIL.Image.open(io.BytesIO(content))
            model = genai.GenerativeModel('gemini-2.5-flash')
            
            prompt = """
            คุณคือ AI ผู้เชี่ยวชาญด้านการอ่านบิลและใบเสนอราคา
            กรุณาอ่านข้อมูลจากรูปภาพนี้ แล้วสกัดข้อมูลวัสดุทั้งหมดออกมาในรูปแบบ JSON Array
            โดยแต่ละรายการต้องมี Key ภาษาไทยดังนี้: "ลำดับ", "ชื่อวัสดุ", "จำนวน", "หน่วยนับ", "ราคา", "หน่วยเงิน"
            (ถ้าช่องไหนไม่มีข้อมูล ให้ใส่ค่าเป็น null)
            ส่งกลับมาแค่โครงสร้าง JSON เท่านั้น ห้ามพิมพ์คำอธิบายอื่นเพิ่มเติมเด็ดขาด
            """
            response = model.generate_content([prompt, image])
            json_str = response.text.replace("```json", "").replace("```", "").strip()
            extracted_data = json.loads(json_str)

        else:
            return {"status": "error", "message": "รองรับเฉพาะไฟล์ Excel, Word และ รูปภาพ เท่านั้น"}

        # =================================================================
        # 🌟 4. ทำความสะอาดข้อมูล: แยกจำนวน/หน่วยนับ, แยกราคา/หน่วยเงิน และแก้คำผิด
        # =================================================================
        print("🔍 กำลังทำความสะอาดข้อมูล...")
        
        for item in extracted_data:
            # --- 1. แยกจำนวนกับหน่วยนับ ---
            raw_qty = str(item.get("จำนวน") or "").strip()
            if raw_qty and raw_qty.lower() not in ["none", "nan", "-"]:
                match = re.match(r"^([\d\.]+)\s*(.*)$", raw_qty)
                if match:
                    item["จำนวน"] = match.group(1).strip()
                    if match.group(2) and not item.get("หน่วยนับ"):
                        item["หน่วยนับ"] = match.group(2).strip()

            # --- 2. 🌟 แยกราคาและหน่วยเงิน (สับตัวเลขออกจากข้อความ) ---
            raw_price = str(item.get("ราคา") or "").strip()
            raw_price = raw_price.replace(",", "") # ลบคอมมาออก (เช่น "1,200 บ." -> "1200 บ.")
            
            if raw_price and raw_price.lower() not in ["none", "nan", "-"]:
                match_price = re.match(r"^([\d\.]+)\s*(.*)$", raw_price)
                if match_price:
                    item["ราคา"] = float(match_price.group(1)) # แปลงเป็นตัวเลขเพียวๆ เพื่อให้ PDF เอาไปคำนวณได้
                    
                    # จัดระเบียบหน่วยเงินให้สวยงาม
                    if match_price.group(2):
                        currency = match_price.group(2).strip()
                        if currency in ["บ.", "THB", "฿"]: # แปลงคำแปลกๆ ให้เป็น "บาท" ให้หมด
                            currency = "บาท"
                        item["หน่วยเงิน"] = currency
                    else:
                        item["หน่วยเงิน"] = "บาท" # ถ้ามีแต่เลข ไม่มีหน่วย ให้ใส่ "บาท" อัตโนมัติ

            # --- 3. TheFuzz แก้คำผิดของชื่อวัสดุ ---
            original_name = str(item.get("ชื่อวัสดุ", "")) or ""
            item["suggestions"] = [] # เตรียมตัวเลือกไว้ให้หน้าบ้าน
            
            if original_name.strip():
                # ดึง 3 อันดับแรกที่คะแนนเกิน 60%
                matches = process.extract(original_name, STANDARD_MATERIALS, limit=3)
                suggestions = [m[0] for m in matches if m[1] >= 60]
                item["suggestions"] = suggestions
                
                best_match, score = matches[0]
                if score == 100:
                    item["สถานะ"] = "correct"
                    item["หมายเหตุ"] = "✅ ถูกต้อง"
                elif score >= 70:
                    item["สถานะ"] = "warning"
                    item["หมายเหตุ"] = f"❓ คล้ายกับ '{best_match}'"
                else:
                    item["สถานะ"] = "error"
                    item["หมายเหตุ"] = "❌ ไม่พบในฐานข้อมูล"

        print("✅ ประมวลผลสำเร็จ ส่ง JSON กลับไปที่หน้าเว็บ!")
        return {"status": "success", "data": extracted_data}

    except Exception as e:
        print("❌ เกิดข้อผิดพลาด:", str(e))
        return {"status": "error", "message": str(e)}