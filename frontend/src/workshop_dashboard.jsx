import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

const FontLink = () => (
  <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700;800&family=IBM+Plex+Mono:wght@400;600&display=swap" rel="stylesheet" />
);

const SEMESTERS = {
  "Semester 1/2025": {
    students: 450,
    months: [
      { month: "Jan", cost: 8400 },
      { month: "Feb", cost: 11200 },
      { month: "Mar", cost: 14600 },
      { month: "Apr", cost: 12800 },
      { month: "May", cost: 7200 },
    ],
    materials: [
      { name: "Steel Pipes (40mm)",    qty: 320,  unit: "m",    unitPrice: 45,  prevQty: 210  },
      { name: "Welding Wire ER70S-6",  qty: 85,   unit: "kg",   unitPrice: 280, prevQty: 62   },
      { name: "Hex Bolts M10×50",      qty: 1200, unit: "pcs",  unitPrice: 4.5, prevQty: 980  },
      { name: "Angle Iron 50×50×5",    qty: 180,  unit: "m",    unitPrice: 78,  prevQty: 175  },
      { name: "Sheet Metal 1.2mm",     qty: 95,   unit: "sheet",unitPrice: 320, prevQty: 88   },
      { name: "Cutting Discs 125mm",   qty: 240,  unit: "pcs",  unitPrice: 35,  prevQty: 190  },
      { name: "Grinding Wheels",       qty: 60,   unit: "pcs",  unitPrice: 120, prevQty: 55   },
      { name: "Safety Goggles",        qty: 30,   unit: "pcs",  unitPrice: 180, prevQty: 28   },
      { name: "Welding Rods E6013",    qty: 40,   unit: "kg",   unitPrice: 95,  prevQty: 38   },
      { name: "Drill Bits Set HSS",    qty: 18,   unit: "set",  unitPrice: 450, prevQty: 20   },
    ],
  },
  "Semester 2/2025": {
    students: 390,
    months: [
      { month: "Jun", cost: 9100  },
      { month: "Jul", cost: 13400 },
      { month: "Aug", cost: 16200 },
      { month: "Sep", cost: 14800 },
      { month: "Oct", cost: 8600  },
    ],
    materials: [
      { name: "Steel Pipes (40mm)",    qty: 290,  unit: "m",    unitPrice: 47,  prevQty: 320  },
      { name: "Welding Wire ER70S-6",  qty: 92,   unit: "kg",   unitPrice: 285, prevQty: 85   },
      { name: "Hex Bolts M10×50",      qty: 1050, unit: "pcs",  unitPrice: 4.8, prevQty: 1200 },
      { name: "Angle Iron 50×50×5",    qty: 210,  unit: "m",    unitPrice: 80,  prevQty: 180  },
      { name: "Sheet Metal 1.2mm",     qty: 110,  unit: "sheet",unitPrice: 330, prevQty: 95   },
      { name: "Cutting Discs 125mm",   qty: 275,  unit: "pcs",  unitPrice: 36,  prevQty: 240  },
      { name: "Grinding Wheels",       qty: 72,   unit: "pcs",  unitPrice: 125, prevQty: 60   },
      { name: "Safety Goggles",        qty: 35,   unit: "pcs",  unitPrice: 185, prevQty: 30   },
      { name: "Welding Rods E6013",    qty: 44,   unit: "kg",   unitPrice: 98,  prevQty: 40   },
      { name: "Drill Bits Set HSS",    qty: 22,   unit: "set",  unitPrice: 460, prevQty: 18   },
    ],
  },
};

const PIE_COLORS = ["#1976D2","#0097A7","#F59E0B","#EF5350","#7E57C2"];

const fmtMoney = n => new Intl.NumberFormat("th-TH",{minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
const fmtInt   = n => new Intl.NumberFormat("th-TH").format(n);

const BarTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{background:"#fff",border:"1px solid #e0e0e0",borderRadius:8,padding:"8px 14px",boxShadow:"0 2px 12px rgba(0,0,0,.1)"}}>
      <p style={{color:"#546E7A",fontSize:11,marginBottom:2}}>{label}</p>
      <p style={{color:"#1565C0",fontWeight:700,fontSize:15,fontFamily:"'IBM Plex Mono',monospace"}}>฿{fmtInt(payload[0].value)}</p>
    </div>
  );
};
const PieTip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{background:"#fff",border:"1px solid #e0e0e0",borderRadius:8,padding:"8px 14px",boxShadow:"0 2px 12px rgba(0,0,0,.1)"}}>
      <p style={{color:"#37474F",fontWeight:600,fontSize:12}}>{payload[0].name}</p>
      <p style={{color:payload[0].payload.fill,fontWeight:700,fontFamily:"'IBM Plex Mono',monospace"}}>฿{fmtInt(payload[0].value)}</p>
      <p style={{color:"#90A4AE",fontSize:11}}>{(payload[0].percent*100).toFixed(1)}%</p>
    </div>
  );
};

const ExportModal = ({ onClose }) => (
  <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"}}>
    <div style={{background:"#fff",borderRadius:16,padding:"36px 40px",width:380,boxShadow:"0 20px 60px rgba(0,0,0,.2)",textAlign:"center"}}>
      <div style={{fontSize:44,marginBottom:12}}>📦</div>
      <h3 style={{fontFamily:"'Prompt',sans-serif",fontSize:22,fontWeight:700,color:"#1A237E",marginBottom:6}}>Export Report</h3>
      <p style={{color:"#78909C",fontSize:13,marginBottom:28}}>Select format for your budget planning document.</p>
      <div style={{display:"flex",gap:14,justifyContent:"center",marginBottom:18}}>
        <button onClick={onClose} style={{background:"#C62828",color:"#fff",border:"none",borderRadius:10,padding:"12px 24px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Prompt',sans-serif"}}>📄 PDF</button>
        <button onClick={onClose} style={{background:"#2E7D32",color:"#fff",border:"none",borderRadius:10,padding:"12px 24px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Prompt',sans-serif"}}>📊 Excel</button>
      </div>
      <button onClick={onClose} style={{background:"transparent",border:"none",color:"#90A4AE",fontSize:12,cursor:"pointer"}}>Cancel</button>
    </div>
  </div>
);

export default function WorkshopDashboard() {
  const [semester, setSemester] = useState("Semester 1/2025");
  const [showExport, setShowExport] = useState(false);
  const data = SEMESTERS[semester];

  const totalCost = useMemo(() => data.materials.reduce((a,m) => a + m.qty * m.unitPrice, 0), [data]);
  const costPerHead = totalCost / data.students;
  const maxMonth = Math.max(...data.months.map(m => m.cost));

  const pieData = useMemo(() =>
    [...data.materials]
      .map(m => ({ name: m.name.split("(")[0].trim(), value: Math.round(m.qty * m.unitPrice) }))
      .sort((a,b) => b.value - a.value)
      .slice(0,5),
    [data]
  );

  return (
    <>
      <FontLink />
      {showExport && <ExportModal onClose={() => setShowExport(false)} />}

      <div style={{minHeight:"100vh",background:"#F0F2F5",fontFamily:"'Prompt',sans-serif"}}>

        {/* NAV */}
        <nav style={{background:"#1565C0",padding:"0 32px",display:"flex",alignItems:"center",justifyContent:"space-between",height:60,boxShadow:"0 2px 10px rgba(21,101,192,.4)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:22}}>⚙️</span>
            <span style={{fontWeight:800,fontSize:18,color:"#fff",letterSpacing:.5}}>DASHBOARD</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:20}}>
            <span style={{color:"rgba(255,255,255,.65)",fontSize:13,fontWeight:500}}>Faculty of Engineering</span>
            <div style={{width:36,height:36,borderRadius:"50%",background:"#FFF3E0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,boxShadow:"0 0 0 3px rgba(255,255,255,.25)"}}>👨‍🏫</div>
          </div>
        </nav>

        <div style={{maxWidth:1260,margin:"0 auto",padding:"30px 28px 60px"}}>

          {/* TITLE + CONTROLS */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:26,flexWrap:"wrap",gap:14}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:3}}>
                <div style={{width:4,height:24,background:"#1565C0",borderRadius:3}}/>
                <h1 style={{fontWeight:800,fontSize:22,color:"#1A237E",letterSpacing:.2}}>Workshop Semester Cost Analysis</h1>
              </div>
              <p style={{color:"#90A4AE",fontSize:12,marginLeft:14}}>Executive budget summary · {semester}</p>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <label style={{color:"#546E7A",fontSize:12,fontWeight:600}}>Semester :</label>
              <select
                value={semester}
                onChange={e => setSemester(e.target.value)}
                style={{border:"1.5px solid #BBDEFB",borderRadius:8,padding:"8px 14px",fontSize:13,fontFamily:"'Prompt',sans-serif",fontWeight:600,color:"#1565C0",background:"#fff",cursor:"pointer",outline:"none"}}
              >
                {Object.keys(SEMESTERS).map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* SUMMARY CARDS */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:20,marginBottom:24}}>

            {/* Card 1 */}
            <div style={{background:"linear-gradient(135deg,#1565C0,#1976D2)",borderRadius:18,padding:"28px 30px",position:"relative",overflow:"hidden",boxShadow:"0 6px 24px rgba(21,101,192,.38)"}}>
              <div style={{position:"absolute",right:-24,top:-24,width:110,height:110,borderRadius:"50%",background:"rgba(255,255,255,.08)"}}/>
              <div style={{position:"absolute",left:-12,bottom:-28,width:88,height:88,borderRadius:"50%",background:"rgba(255,255,255,.05)"}}/>
              <p style={{color:"rgba(255,255,255,.7)",fontSize:10,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>Total Semester Cost</p>
              <p style={{color:"#fff",fontWeight:800,fontSize:30,fontFamily:"'IBM Plex Mono',monospace",marginBottom:4}}>฿{fmtInt(Math.round(totalCost))}</p>
              <p style={{color:"rgba(255,255,255,.55)",fontSize:11}}>THB · Materials budget consumed</p>
              <div style={{marginTop:14,display:"inline-block",background:"rgba(255,255,255,.15)",borderRadius:6,padding:"3px 10px",fontSize:10,color:"rgba(255,255,255,.85)",fontWeight:600}}>
                📦 {data.materials.length} material types
              </div>
            </div>

            {/* Card 2 */}
            <div style={{background:"linear-gradient(135deg,#00838F,#0097A7)",borderRadius:18,padding:"28px 30px",position:"relative",overflow:"hidden",boxShadow:"0 6px 24px rgba(0,151,167,.32)"}}>
              <div style={{position:"absolute",right:-24,top:-24,width:110,height:110,borderRadius:"50%",background:"rgba(255,255,255,.08)"}}/>
              <p style={{color:"rgba(255,255,255,.7)",fontSize:10,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>Total Students</p>
              <p style={{color:"#fff",fontWeight:800,fontSize:40,fontFamily:"'IBM Plex Mono',monospace",marginBottom:4}}>{fmtInt(data.students)}</p>
              <p style={{color:"rgba(255,255,255,.55)",fontSize:11}}>Students who used the workshop</p>
              <div style={{marginTop:14,display:"inline-block",background:"rgba(255,255,255,.15)",borderRadius:6,padding:"3px 10px",fontSize:10,color:"rgba(255,255,255,.85)",fontWeight:600}}>
                👨‍🎓 Active enrollment
              </div>
            </div>

            {/* Card 3 - Cost per Head ★ */}
            <div style={{background:"linear-gradient(135deg,#E65100,#F57C00)",borderRadius:18,padding:"28px 30px",position:"relative",overflow:"hidden",boxShadow:"0 6px 24px rgba(230,81,0,.38)"}}>
              <div style={{position:"absolute",right:-24,top:-24,width:110,height:110,borderRadius:"50%",background:"rgba(255,255,255,.1)"}}/>
              <div style={{position:"absolute",left:-12,bottom:-28,width:88,height:88,borderRadius:"50%",background:"rgba(255,255,255,.06)"}}/>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                <span style={{fontSize:14,color:"#FFD54F"}}>★</span>
                <p style={{color:"rgba(255,255,255,.85)",fontSize:10,fontWeight:700,letterSpacing:2,textTransform:"uppercase"}}>Cost per Head</p>
              </div>
              <p style={{color:"#fff",fontWeight:800,fontSize:30,fontFamily:"'IBM Plex Mono',monospace",marginBottom:3}}>฿{fmtMoney(costPerHead)}</p>
              <p style={{color:"rgba(255,255,255,.55)",fontSize:11}}>Average cost per student / semester</p>
              <div style={{marginTop:12,display:"inline-block",background:"rgba(255,255,255,.15)",borderRadius:6,padding:"4px 10px",fontSize:10,color:"rgba(255,255,255,.9)",fontWeight:600}}>
                ฿{fmtInt(Math.round(totalCost))} ÷ {fmtInt(data.students)} students
              </div>
            </div>
          </div>

          {/* CHARTS */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 400px",gap:20,marginBottom:22}}>

            {/* Bar */}
            <div style={{background:"#fff",borderRadius:16,padding:"24px 28px",boxShadow:"0 1px 8px rgba(0,0,0,.07)",border:"1px solid #E8EDF2"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                <div>
                  <p style={{color:"#90A4AE",fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase"}}>Spending Trend</p>
                  <h3 style={{color:"#1A237E",fontWeight:700,fontSize:17,marginTop:2}}>Monthly Usage Cost</h3>
                </div>
                <div style={{background:"#E3F2FD",borderRadius:7,padding:"4px 12px",fontSize:11,color:"#1565C0",fontWeight:700}}>THB</div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.months} barCategoryGap="40%" margin={{top:8,right:0,left:-10,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F4F8" vertical={false}/>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill:"#90A4AE",fontSize:12,fontWeight:600}}/>
                  <YAxis axisLine={false} tickLine={false} tick={{fill:"#BDBDBD",fontSize:11}} tickFormatter={v=>`฿${(v/1000).toFixed(0)}k`} width={46}/>
                  <Tooltip content={<BarTip/>} cursor={{fill:"#F8FAFC"}}/>
                  <Bar dataKey="cost" radius={[8,8,0,0]}>
                    {data.months.map((m,i) => <Cell key={i} fill={m.cost===maxMonth?"#1565C0":"#90CAF9"}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p style={{textAlign:"center",color:"#BDBDBD",fontSize:10,marginTop:4}}>Peak month highlighted in dark blue</p>
            </div>

            {/* Pie */}
            <div style={{background:"#fff",borderRadius:16,padding:"24px 24px",boxShadow:"0 1px 8px rgba(0,0,0,.07)",border:"1px solid #E8EDF2"}}>
              <div style={{marginBottom:16}}>
                <p style={{color:"#90A4AE",fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase"}}>Budget Distribution</p>
                <h3 style={{color:"#1A237E",fontWeight:700,fontSize:17,marginTop:2}}>Top 5 Highest-Cost Materials</h3>
              </div>
              <ResponsiveContainer width="100%" height={178}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={76} paddingAngle={3} dataKey="value">
                    {pieData.map((_,i) => <Cell key={i} fill={PIE_COLORS[i]}/>)}
                  </Pie>
                  <Tooltip content={<PieTip/>}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{display:"flex",flexDirection:"column",gap:7,marginTop:10}}>
                {pieData.map((item,i) => {
                  const total = pieData.reduce((a,x)=>a+x.value,0);
                  const pct = ((item.value/total)*100).toFixed(0);
                  return (
                    <div key={i} style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{width:9,height:9,borderRadius:2,background:PIE_COLORS[i],flexShrink:0}}/>
                      <span style={{color:"#546E7A",fontSize:11,flex:1}}>{item.name}</span>
                      <div style={{background:"#F5F5F5",borderRadius:4,padding:"1px 7px",fontSize:10,color:"#78909C",fontWeight:700}}>{pct}%</div>
                      <span style={{color:PIE_COLORS[i],fontSize:11,fontFamily:"'IBM Plex Mono',monospace",fontWeight:700}}>฿{fmtInt(item.value)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* TABLE */}
          <div style={{background:"#fff",borderRadius:16,boxShadow:"0 1px 8px rgba(0,0,0,.07)",border:"1px solid #E8EDF2",overflow:"hidden"}}>
            <div style={{padding:"22px 28px 18px",borderBottom:"1px solid #F3F4F6",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
              <div>
                <p style={{color:"#90A4AE",fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase"}}>Full Inventory</p>
                <h3 style={{color:"#1A237E",fontWeight:700,fontSize:17,marginTop:2}}>Detailed Material Consumption</h3>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:18,fontSize:11}}>
                <span style={{display:"flex",alignItems:"center",gap:5,color:"#EF5350",fontWeight:700}}>↑ Higher than prev. semester</span>
                <span style={{display:"flex",alignItems:"center",gap:5,color:"#66BB6A",fontWeight:700}}>↓ Lower than prev. semester</span>
              </div>
            </div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead>
                  <tr style={{background:"#FAFAFA"}}>
                    {["#","Material Name","Qty Consumed","Unit Price (THB)","Total Cost (THB)","vs. Prev"].map((h,i) => (
                      <th key={i} style={{
                        padding:"11px 20px",
                        textAlign:i===0?"center":i>=2?"right":"left",
                        color:"#90A4AE",fontSize:10,fontWeight:700,
                        letterSpacing:1.2,textTransform:"uppercase",
                        borderBottom:"1px solid #F0F0F0",whiteSpace:"nowrap"
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.materials.map((m,i) => {
                    const total = m.qty * m.unitPrice;
                    const isHigher = m.qty > m.prevQty;
                    const pct = Math.round(Math.abs((m.qty-m.prevQty)/m.prevQty*100));
                    return (
                      <tr key={i} style={{borderBottom:"1px solid #F9F9F9",background:i%2===0?"#fff":"#FAFBFC"}}>
                        <td style={{padding:"13px 20px",textAlign:"center",color:"#BDBDBD",fontSize:12,fontFamily:"'IBM Plex Mono',monospace"}}>
                          {String(i+1).padStart(2,"0")}
                        </td>
                        <td style={{padding:"13px 20px"}}>
                          <span style={{color:"#263238",fontSize:13,fontWeight:600}}>{m.name}</span>
                        </td>
                        <td style={{padding:"13px 20px",textAlign:"right",color:"#546E7A",fontSize:13,fontFamily:"'IBM Plex Mono',monospace"}}>
                          {fmtInt(m.qty)} <span style={{color:"#BDBDBD",fontSize:11}}>{m.unit}</span>
                        </td>
                        <td style={{padding:"13px 20px",textAlign:"right",color:"#78909C",fontSize:13,fontFamily:"'IBM Plex Mono',monospace"}}>
                          ฿{fmtMoney(m.unitPrice)}
                        </td>
                        <td style={{padding:"13px 20px",textAlign:"right"}}>
                          <span style={{color:"#1565C0",fontSize:14,fontFamily:"'IBM Plex Mono',monospace",fontWeight:700}}>
                            ฿{fmtInt(Math.round(total))}
                          </span>
                        </td>
                        <td style={{padding:"13px 20px",textAlign:"right"}}>
                          <span style={{
                            display:"inline-flex",alignItems:"center",gap:3,
                            background:isHigher?"#FFEBEE":"#E8F5E9",
                            color:isHigher?"#EF5350":"#66BB6A",
                            borderRadius:6,padding:"3px 10px",fontSize:11,fontWeight:800
                          }}>
                            {isHigher?"↑":"↓"} {pct}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{background:"#E8EAF6",borderTop:"2px solid #C5CAE9"}}>
                    <td colSpan={4} style={{padding:"15px 20px",color:"#3949AB",fontWeight:700,fontSize:13}}>
                      Semester Total · {data.materials.length} items
                    </td>
                    <td style={{padding:"15px 20px",textAlign:"right"}}>
                      <span style={{color:"#1A237E",fontSize:17,fontWeight:800,fontFamily:"'IBM Plex Mono',monospace"}}>
                        ฿{fmtInt(Math.round(totalCost))}
                      </span>
                    </td>
                    <td/>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
