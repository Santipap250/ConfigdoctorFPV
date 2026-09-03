# Production verification TODO

- [ ] เปิดเว็บไซต์ production และตรวจ HTTP status, console errors และ failed network requests
- [ ] ทดสอบ Home, navigation, Workbench, Tools และ Config flow บน production
- [ ] ทดสอบ responsive layout ที่ 390px และ desktop viewport
- [ ] เปรียบเทียบอาการที่พบกับ source code และ build/deploy configuration
- [ ] แก้ไขปัญหา production ที่ยืนยันได้โดยไม่สร้าง fake success state
- [ ] รัน TypeScript checks, tests และ production build หลังแก้ไข
- [ ] ตรวจสอบ production ซ้ำหลังมีการเผยแพร่หรือ sync การแก้ไข
- [ ] บันทึก checkpoint และรายงาน commit, test, build และ deployment status
