from fastapi import FastAPI, File, UploadFile
import shutil

app = FastAPI()

print("="*60)
print("🚀 เริ่มต้นเซิร์ฟเวอร์ FastAPI สำหรับรับไฟล์")
print("="*60)

# สร้าง Endpoint (เส้นทาง API) สำหรับให้ React ยิงไฟล์เข้ามา
@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    
    # 1. เช็คชื่อและนามสกุลไฟล์ที่อัปโหลดเข้ามา
    file_name = file.filename
    print(f"📥 มีไฟล์ส่งเข้ามา: {file_name}")

    # 2. จำลองการบันทึกไฟล์นั้นลงในเครื่องเซิร์ฟเวอร์ชั่วคราว (เพื่อรอเอาไปสกัดข้อมูล)
    # สมมติเราเซฟชื่อว่า 'temp_uploaded_file' บวกด้วยนามสกุลเดิม
    extension = file_name.split(".")[-1]
    temp_file_path = f"temp_uploaded_file.{extension}"
    
    with open(temp_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    print(f"✅ บันทึกไฟล์ชั่วคราวสำเร็จ: {temp_file_path}")

    # 3. ส่งข้อความตอบกลับไปหาหน้าเว็บ React (เป็น JSON)
    return {
        "status": "success",
        "message": f"ได้รับไฟล์ {file_name} เรียบร้อยแล้ว!",
        "file_type": extension
    }