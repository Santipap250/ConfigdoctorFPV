# แนวคิดการออกแบบ OBIXCONFIGDOCTORFPV

## สามแนวทางที่พิจารณา

| Theme Name | Very Brief Intro | Probability |
|---|---|---:|
| Flight Deck Atelier | เวิร์กสเตชันการบินแบบวิศวกรรม ใช้ผิวกราไฟต์ เส้น telemetry และเขียวไฟแสดงสถานะอย่างประณีต | 0.07 |
| Field Notebook Precision | คู่มือสนามระดับพรีเมียมในโทนกระดาษอุ่น ผสานกริดสเก็ตช์และตัวเลขเชิงเทคนิค | 0.04 |
| Signal Chamber | ห้องวิเคราะห์สัญญาณแบบมืดสนิท ใช้กราฟสเปกตรัมและโทนสีน้ำเงินไฟฟ้าอย่างจำกัด | 0.08 |

## แนวทางที่เลือก: Flight Deck Atelier

### Design Movement

แนวทาง **industrial precision / aerospace instrumentation** ที่ตีความ cockpit และสถานีทดสอบอากาศยานให้เป็นผลิตภัณฑ์ดิจิทัลร่วมสมัย ไม่ใช่หน้าจอ sci-fi ที่ฉูดฉาด

### Core Principles

1. **ข้อมูลนำการตกแต่ง** — ทุกองค์ประกอบต้องช่วยให้ตัดสินใจ สร้างค่า หรือยืนยันผลการคำนวณได้รวดเร็ว
2. **ความแม่นยำที่สัมผัสได้** — ใช้เส้นแบ่งบาง ระบบหน่วย ตัวเลขแบบ tabular และสถานะสีที่มีความหมายชัดเจน
3. **ชั้นของพื้นที่ทำงาน** — แทนการเรียง card กลางหน้า ใช้ rail ด้านข้าง พื้นผิว panel ซ้อน และทางเดินสายตาแบบ cockpit
4. **เคลื่อนไหวเท่าที่จำเป็น** — motion ใช้เฉพาะการเปิด panel การเปลี่ยนผลลัพธ์ และการยืนยันการกระทำ

### Color Philosophy

พื้นหลัง **graphite-carbon** ทำให้ข้อมูลสีอ่อนอ่านได้นานและให้ความรู้สึกเหมือนเครื่องมือจริง ไม่ใช่เกม สีเด่นใช้ **OBIX Signal Lime** เพื่อสื่อความพร้อม การคำนวณที่เชื่อถือได้ และ action หลัก ส่วน cyan ใช้กับข้อมูลรอง สี amber และ red จำกัดเฉพาะคำเตือนและความเสี่ยง จึงทำให้สถานะมีน้ำหนักจริง

### Layout Paradigm

โครงสร้างแบบ **Instrument Rail + Work Surface**: desktop ใช้ rail ซ้ายที่คงอยู่ พร้อมพื้นที่ทำงานที่แบ่งเป็น “mission strip” ด้านบน, canvas สำหรับงานหลัก และ status line ด้านล่าง; mobile เปลี่ยนเป็น top mission strip กับ bottom navigation และแผงเครื่องมือแบบ sheet จึงไม่ย่อ sidebar เดิมลงมาอย่างเสียสัดส่วน

### Signature Elements

1. **Telemetry grid**: เส้นกริดจางและเส้น scan line ขนาดเล็กในพื้นหลังเพื่อสร้างพื้นที่การทำงาน
2. **Status lozenges**: แถบสถานะเหลี่ยมมุมเฉียงเล็กน้อย มีจุดสัญญาณและข้อความสั้นที่อ่านไว
3. **Instrument rule**: เส้นค่า / หน่วย / ตัวคั่นแบบ monospaced ที่ใช้สอดประสานใน header, metric และ CLI viewer

### Interaction Philosophy

ผู้ใช้ควรรู้เสมอว่าอยู่ที่ใด กำลังแก้ค่าอะไร และผลใดอัปเดตตามจริง ปุ่มหลักใช้ label แบบกริยาโดยตรง, input แสดงหน่วยชัดเจน, validation แสดงเหตุผลแทนการกล่าวอ้างกว้าง ๆ และ action ที่ยังไม่พร้อมต้องสื่อว่าเป็น “กำลังพัฒนา” อย่างตรงไปตรงมา

### Animation

การเข้าหน้าใช้ fade กับ translate ระยะสั้นแบบ stagger 40–70ms; panel และ drawer ใช้ transform/opacity ไม่เกิน 260ms ด้วย easing ที่คม; ตัวเลขผลคำนวณเปลี่ยนค่าด้วย transition เบา ๆ; ปุ่มกด scale 0.97; ไม่มี motion สำคัญเมื่อเปิด `prefers-reduced-motion` และไม่มีอนิเมชันที่ขัดกับการใช้งาน input หรือ keyboard shortcut

### Typography System

ใช้ **Space Grotesk** สำหรับหัวเรื่องและ label ที่ต้องมีบุคลิกเชิงวิศวกรรม, **IBM Plex Sans Thai** สำหรับข้อความภาษาไทยและฟอร์ม, และ **JetBrains Mono** สำหรับค่า หน่วย CLI และ metadata หัวข้อเน้นน้ำหนัก 600–700; เนื้อหา 400–500; label ตัวพิมพ์ใหญ่มี tracking เพิ่มเพื่อแยกจากค่าข้อมูล

### Brand Essence

**OBIXCONFIGDOCTORFPV คือ workbench ที่ทำให้ FPV pilot สร้าง ตรวจสอบ และปรับแต่งโดรนด้วยข้อมูลที่อธิบายได้ในที่เดียว**

บุคลิก: **แม่นยำ, สุขุม, มุ่งภารกิจ**

### Brand Voice

น้ำเสียงสั้น ชัด และยืนยันเฉพาะสิ่งที่ระบบคำนวณหรือรู้จริง; หลีกเลี่ยงคำโฆษณาเกินจริงและคำคลุมเครือ

> “กำหนด build ให้ชัด แล้วให้ข้อมูลพาไปถึง tune ที่เหมาะสม”

> “ตรวจค่าก่อนบิน ไม่ต้องเดาจากความรู้สึก”

### Wordmark & Logo

โลโก้เป็นสัญลักษณ์ **O แบบวงแหวน telemetry ที่มีเส้นแกนตัดเป็นรูปใบพัดสี่แขนแบบนามธรรม** ไม่มีข้อความภายใน mark; wordmark ใช้ Space Grotesk custom tracking สื่อความเป็นระบบเครื่องมือ

### Signature Brand Color

**OBIX Signal Lime — #B8FF4D**

## Style Decisions

- ผิวหลักเป็น graphite, border แบบ hairline, radius เล็กถึงปานกลาง และไม่ใช้ gradient ขนาดใหญ่
- หน้า home ต้องเป็นจุดเริ่มงานจริง โดย quick-start actions เปิด workbench state ไม่ใช่ landing ที่มีเพียง marketing copy
- ผลลัพธ์ที่เป็นตัวเลขต้องบอกหน่วย ที่มา และเงื่อนไขการตีความเสมอ
- หน้าแรกต้องอ่านเป็น active workbench ตั้งแต่ viewport แรก: มี rail, mission strip, canvas และ status line ก่อนเนื้อหาเชิงแนะนำ
- ทุกหน้าหลักใช้ telemetry-ring O propeller mark ร่วมกับ wordmark Space Grotesk ที่มี tracking ชัดเจน; ห้ามใช้จุดสถานะหรือข้อความลอยแทนโลโก้หลัก
- ข้อความหลักต้องระบุการกระทำและเงื่อนไขที่สังเกตได้ เช่น calculate, validate, store, compare และ flag เท่านั้น
