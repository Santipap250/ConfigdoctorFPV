import { useState } from "react";
import { AlertTriangle, BatteryCharging, CheckCircle2, ChevronDown, Gauge, Ruler, ShieldCheck, Target } from "lucide-react";

const steps = [
  { icon: Ruler, number: "01", title: "เริ่มจากค่าที่รู้จริง", body: "กรอก battery cells, capacity, C rating, น้ำหนัก และ peak current จากอุปกรณ์หรือการวัดจริง อย่าใส่ค่าที่เดาเพื่อให้คะแนนสูงขึ้น เพราะ engine ตั้งใจลดความมั่นใจเมื่อข้อมูลไม่ครบ" },
  { icon: BatteryCharging, number: "02", title: "ตรวจ power และ voltage sag", body: "ดู Power Headroom ว่า peak current ยังต่ำกว่าความสามารถต่อเนื่องของ pack หรือไม่ จากนั้นใส่ pack resistance ที่วัดได้เป็น mΩ เพื่อดูแรงดันตกขณะโหลด" },
  { icon: Gauge, number: "03", title: "ใส่ thrust ที่วัดจริง", body: "ใช้ static thrust ต่อ motor จาก thrust stand หรือข้อมูล bench test ที่เชื่อถือได้ ค่า thrust-to-weight จะไม่ถูกเดาให้เอง และค่าที่ไม่กรอกจะทำให้ readiness ลดลงโดยเจตนา" },
  { icon: CheckCircle2, number: "04", title: "ทำ field checklist ให้ครบ", body: "ตรวจใบพัด ทิศทางมอเตอร์ สกรู แบตเตอรี่ failsafe และจุดสำคัญอื่น ๆ ก่อน arm กด Mark checklist complete ได้เมื่อรายการทั้งหมดถูกตรวจในภาคสนามแล้ว" },
];

export function MissionReadinessGuide() {
  const [openStep, setOpenStep] = useState("01");
  return <section className="readiness-guide" aria-labelledby="readiness-guide-title">
    <header className="readiness-guide__header"><div><div className="eyebrow"><i />FIELD GUIDE / MISSION READINESS</div><h2 id="readiness-guide-title">อ่านคะแนนให้ถูก <em>ก่อนออกบิน.</em></h2><p>คู่มือสั้นสำหรับใช้ engine เป็น decision gate ก่อน arm — ไม่ใช่ใบรับรองความปลอดภัย และไม่แทนที่ judgement ของนักบิน</p></div><div className="readiness-guide__badge"><Target size={16} /> PILOT OPERATING NOTE</div></header>
    <div className="readiness-guide__body"><div className="guide-steps">{steps.map(({ icon: Icon, number, title, body }) => { const open = openStep === number; return <article className={`guide-step ${open ? "is-open" : ""}`} key={number}><button onClick={() => setOpenStep(open ? "" : number)} aria-expanded={open}><span className="guide-step__icon"><Icon size={17} /></span><span><small>{number} / STEP</small><strong>{title}</strong></span><ChevronDown size={16} /></button>{open && <p>{body}</p>}</article>; })}</div><aside className="guide-safety"><div className="guide-safety__icon"><ShieldCheck size={20} /></div><div><span className="panel-label">SAFETY GATE</span><h3>คะแนนสูง ≠ พร้อมบินเสมอ</h3><p>ใช้คะแนนเพื่อหา input ที่ต้องตรวจซ้ำ ถ้ามี warning, pack ร้อนผิดปกติ, มอเตอร์สั่น หรือ failsafe ยังไม่ผ่าน ให้หยุดและแก้ไขก่อน arm</p></div><div className="guide-safety__rule"><AlertTriangle size={14} /><span>ถ้าไม่แน่ใจ ให้ hold — อย่าฝืน launch</span></div></aside></div>
  </section>;
}

export default MissionReadinessGuide;
