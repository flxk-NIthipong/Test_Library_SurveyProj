import os
from google import genai
from google.genai import types
from PIL import Image
import json
from dotenv import load_dotenv

# 1. 🔑 ใส่ API Key ของคุณ
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=API_KEY)

print("="*75)
print("🚀 เริ่มต้นทดสอบ Gemini API (อัปเกรดใช้ Library google-genai ตัวล่าสุด)")
print("="*75)

image_path = "../MockData/picture_without_table.jpg"

try:
    print(f"📥 กำลังโหลดรูปภาพ: {image_path}")
    img = Image.open(image_path)

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

    print("⏳ กำลังส่งรูปภาพให้ Gemini วิเคราะห์ (ขั้นตอนนี้ต้องต่ออินเทอร์เน็ต)...")
    
    # 3. เรียกใช้ API ด้วยคำสั่งรูปแบบใหม่
    response = client.models.generate_content(
        model='gemini-2.5-flash', 
        contents=[prompt, img],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.1
        )
    )

    # 4. แปลงข้อความที่ AI ตอบกลับมา ให้กลายเป็น JSON
    result_json = json.loads(response.text)

    print("\n✅ วิเคราะห์สำเร็จ! ข้อมูล JSON ที่สกัดได้:")
    for item in result_json:
        print(f"   {item}")

except FileNotFoundError:
    print(f"❌ Error: หาไฟล์รูปภาพ '{image_path}' ไม่เจอครับ")
except Exception as e:
    print(f"❌ Error: เกิดข้อผิดพลาด -> {e}")

print("="*75)