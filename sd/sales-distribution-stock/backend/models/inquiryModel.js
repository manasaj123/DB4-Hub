const db = require("../config/db")

const Inquiry = {

getAll:(cb)=>{
db.query("SELECT * FROM inquiries",cb)
},

// getAll:(cb)=>{
//   db.query(`
//     SELECT 
//       inquiries.*,
//       material_stock.material_code AS materialCode
//     FROM inquiries
//     LEFT JOIN material_stock
//       ON inquiries.materialId = material_stock.material_id
//   `, cb)
// },

create:(data,cb)=>{
db.query("INSERT INTO inquiries SET ?",data,cb)
},

update:(id,data,cb)=>{
db.query("UPDATE inquiries SET ? WHERE inquiry_id=?",[data,id],cb)
},

delete:(id,cb)=>{
db.query("DELETE FROM inquiries WHERE inquiry_id=?",[id],cb)
}

}

module.exports = Inquiry
