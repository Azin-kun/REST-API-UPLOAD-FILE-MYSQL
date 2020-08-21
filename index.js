const express = require("express")
const app = express()
const multer = require("multer") // untuk upload file
const path = require("path") // untuk memanggil path direktori
const fs = require("fs") // untuk manajemen file
const mysql = require("mysql")
const bodyParser = require("body-parser")
const cors = require("cors")
const moment = require("moment")

app.use(express.static(__dirname));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(cors())


//proses upload file ===============================================================================================================================


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // set file storage
        cb(null, './image');
    },
    filename: (req, file, cb) => {
        // generate file name 
        cb(null, "image-"+ Date.now() + path.extname(file.originalname))
    }
})


let upload = multer({storage: storage})
// let upload = multer({dest: storage})


//konfigurasi database =============================================================================================================================


const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "olshop"
})

db.connect(error => {
    if (error) {
        console.log(error.message)
    } else {
        console.log("MySQL Connected")
    }
})


// end point barang =======================================================================================================================================


// endpoint untuk menambah data barang baru
app.post("/barang",upload.single("image"), (req, res) => {
    // prepare data
    

    if (!req.file) {
        // jika tidak ada file yang diupload
        res.json({
            message: "Tidak ada file yang dikirim"
        })
    } else {
        let data = {
            nama_barang: req.body.nama_barang,
            harga: req.body.harga,
            stok: req.body.stok,
            deskripsi: req.body.deskripsi,
            image: req.file.filename
        }
        // create sql insert
        let sql = "insert into barang set ?"

        // run query
        db.query(sql, data, (error, result) => {
            if(error) throw error
            res.json({
                message: result.affectedRows + " data berhasil disimpan"
            })
        })
    }
})



// endpoint untuk mengubah data barang
app.put("/barang", upload.single("image"), (req,res) => {
    let data = null, sql = null
    // paramter perubahan data
    let param = { kode_barang: req.body.kode_barang }

    if (!req.file) {
        // jika tidak ada file yang dikirim = update data saja
        data = {
            nama_barang: req.body.nama_barang,
            harga: req.body.harga,
            stok: req.body.stok,
            deskripsi: req.body.deskripsi
        }
    } else {
        // jika mengirim file = update data + reupload
        data = {
            nama_barang: req.body.nama_barang,
            harga: req.body.harga,
            stok: req.body.stok,
            deskripsi: req.body.deskripsi,
            image: req.file.filename
        }

        // get data yg akan diupdate utk mendapatkan nama file yang lama
        sql = "select * from barang where ?"
        // run query
        db.query(sql, param, (err, result) => {
            if (err) throw err
            // tampung nama file yang lama
            let fileName = result[0].image

            // hapus file yg lama
            let dir = path.join(__dirname,"image",fileName)
            fs.unlink(dir, (error) => {})
        })

    }

    // create sql update
    sql = "update barang set ? where ?"

    // run sql update
    db.query(sql, [data,param], (error, result) => {
        if (error) {
            res.json({
                message: error.message
            })
        } else {
            res.json({
                message: result.affectedRows + " data berhasil diubah"
            })
        }
    })
})



// endpoint untuk menghapus data barang
app.delete("/barang/:kode_barang", (req,res) => {
    let param = {kode_barang: req.params.kode_barang}

    // ambil data yang akan dihapus
    let sql = "select * from barang where ?"
    // run query
    db.query(sql, param, (error, result) => {
        if (error) throw error
        
        // tampung nama file yang lama
        let fileName = result[0].image

        // hapus file yg lama
        let dir = path.join(__dirname,"image",fileName)
        fs.unlink(dir, (error) => {})
    })

    // create sql delete
    sql = "delete from barang where ?"

    // run query
    db.query(sql, param, (error, result) => {
        if (error) {
            res.json({
                message: error.message
            })
        } else {
            res.json({
                message: result.affectedRows + " data berhasil dihapus"
            })
        }      
    })
})




// endpoint ambil data barang
app.get("/barang", (req, res) => {
    // create sql query
    let sql = "select * from barang"

    // run query
    db.query(sql, (error, result) => {
        if (error) throw error
        res.json({
            data: result,
            count: result.length
        })
    })
})



// end point admin =======================================================================================================================================


// end-point akses data admin
app.get("/admin",(req, res) => {
    // create sql query
    let sql = "select * from admin"

    // run query
    db.query(sql, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message // pesan error
            }            
        } else {
            response = {
                count: result.length, // jumlah data
                admin: result // isi data
            }            
        }
        res.json(response) // send response
    })
})

// end-point akses dataadmin berdasarkan id_admin tertentu
app.get("/admin/:id",(req, res) => {
    let data = {
        id_admin: req.params.id
    }
    // create sql query
    let sql = "select * from admin where ?"

    // run query
    db.query(sql, data, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message // pesan error
            }            
        } else {
            response = {
                count: result.length, // jumlah data
                pelanggan: result // isi data
            }            
        }
        res.json(response) // send response
    })
})

// end-point menyimpan data admin
app.post("/admin",(req,res) => {

    // prepare data
    let data = {
        nama_admin: req.body.nama_admin,
        username: req.body.username,
        password: req.body.password
    }

    // create sql query insert
    let sql = "insert into admin set ?"

    // run query
    db.query(sql, data, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message
            }
        } else {
            response = {
                message: result.affectedRows + " data inserted"
            }
        }
        res.json(response) // send response
    })
})

// end-point mengubah data admin
app.put("/admin",(req,res) => {

    // prepare data
    let data = [
        // data
        {
            nama_admin: req.body.nama_admin,
            username: req.body.username,
            password: req.body.password
        },

        // parameter (primary key)
        {
            id_admin: req.body.id_admin
        }
    ]

    // create sql query update
    let sql = "update admin set ? where ?"

    // run query
    db.query(sql, data, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message
            }
        } else {
            response = {
                message: result.affectedRows + " data updated"
            }
        }
        res.json(response) // send response
    })
})

app.delete("/admin/:id",(req,res) => {
    // prepare data
    let data = {
        id_admin: req.params.id
    }

    // create query sql delete
    let sql = "delete from admin where ?"

    // run query
    db.query(sql, data, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message
            }
        } else {
            response = {
                message: result.affectedRows + " data deleted"
            }
        }
        res.json(response) // send response
    })
})


// end point users =======================================================================================================================================


// endpoint untuk menambah data users baru
app.post("/users",upload.single("foto"), (req, res) => {
    // prepare data
    

    if (!req.file) {
        // jika tidak ada file yang diupload
        res.json({
            message: "Tidak ada file yang dikirim"
        })
    } else {
        let data = {
            nama_users: req.body.nama_users,
            alamat: req.body.alamat,
            foto: req.file.filename,
            username: req.body.username,
            password: req.body.password
        }
        // create sql insert
        let sql = "insert into users set ?"

        // run query
        db.query(sql, data, (error, result) => {
            if(error) throw error
            res.json({
                message: result.affectedRows + " data berhasil disimpan"
            })
        })
    }
})



// endpoint untuk mengubah data users
app.put("/users", upload.single("foto"), (req,res) => {
    let data = null, sql = null
    // paramter perubahan data
    let param = { id_users: req.body.id_users }

    if (!req.file) {
        // jika tidak ada file yang dikirim = update data saja
        data = {
            nama_users: req.body.nama_users,
            alamat: req.body.alamat,
            username: req.body.username,
            password: req.body.password
        }
    } else {
        // jika mengirim file = update data + reupload
        data = {
            nama_users: req.body.nama_users,
            alamat: req.body.alamat,
            foto: req.file.filename,
            username: req.body.username,
            password: req.body.password
        }

        // get data yg akan diupdate utk mendapatkan nama file yang lama
        sql = "select * from users where ?"
        // run query
        db.query(sql, param, (err, result) => {
            if (err) throw err
            // tampung nama file yang lama
            let fileName = result[0].foto

            // hapus file yg lama
            let dir = path.join(__dirname,"foto",fileName)
            fs.unlink(dir, (error) => {})
        })

    }

    // create sql update
    sql = "update users set ? where ?"

    // run sql update
    db.query(sql, [data,param], (error, result) => {
        if (error) {
            res.json({
                message: error.message
            })
        } else {
            res.json({
                message: result.affectedRows + " data berhasil diubah"
            })
        }
    })
})



// endpoint untuk menghapus data users
app.delete("/users/:id_users", (req,res) => {
    let param = {id_users: req.params.id_users}

    // ambil data yang akan dihapus
    let sql = "select * from users where ?"
    // run query
    db.query(sql, param, (error, result) => {
        if (error) throw error
        
        // tampung nama file yang lama
        let fileName = result[0].foto

        // hapus file yg lama
        let dir = path.join(__dirname,"foto",fileName)
        fs.unlink(dir, (error) => {})
    })

    // create sql delete
    sql = "delete from users where ?"

    // run query
    db.query(sql, param, (error, result) => {
        if (error) {
            res.json({
                message: error.message
            })
        } else {
            res.json({
                message: result.affectedRows + " data berhasil dihapus"
            })
        }      
    })
})




// endpoint ambil data users
app.get("/users", (req, res) => {
    // create sql query
    let sql = "select * from users"

    // run query
    db.query(sql, (error, result) => {
        if (error) throw error
        res.json({
            data: result,
            count: result.length
        })
    })
})


// end point detail_transaksi =======================================================================================================================================

// end-point menambah data transaksi
app.post("/detail_transaksi", (req,res) => {

    // prepare data
    let data = {
        kode_barang: req.body.kode_barang,
        jumlah: req.body.jumlah,
        harga_beli: req.body.harga_beli,
    }

    // create sql query insert
    let sql = "insert into detail_transaksi set ?"

    // run query
    db.query(sql, data, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message
            }
        } else {
            response = {
                message: result.affectedRows + " data inserted"
            }
        }
        res.json(response) // send response
    })
})

// end-point mengubah data transaksi
app.put("/detail_transaksi",(req,res) => {

    // prepare data
    let data = [
        // data
        {
            kode_barang: req.body.kode_barang,
            jumlah: req.body.jumlah,
            harga_beli: req.body.harga_beli,
        },

        // parameter (primary key)
        {
           kode_transaksi: req.body.kode_transaksi
        }
    ]

    // create sql query update
    let sql = "update detail_transaksi set ? where ?"

    // run query
    db.query(sql, data, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message
            }
        } else {
            response = {
                message: result.affectedRows + " data updated"
            }
        }
        res.json(response) // send response
    })
})

app.delete("/detail_transaksi/:kode_transaksi",(req,res) => {
    // prepare data
    let data = {
        kode_transaksi: req.params.kode_transaksi
    }

    // create query sql delete
    let sql = "delete from detail_transaksi where ?"

    // run query
    db.query(sql, data, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message
            }
        } else {
            response = {
                message: result.affectedRows + " data deleted"
            }
        }
        res.json(response) // send response
    })
})

// endpoint ambil data transaksi
app.get("/detail_transaksi", (req, res) => {
    // create sql query
    let sql = "select * from detail_transaksi"

    // run query
    db.query(sql, (error, result) => {
        if (error) throw error
        res.json({
            data: result,
            count: result.length
        })
    })
})

// end point detail transaksi =======================================================================================================================================

// end-point menambah data detail transaksi
app.post("/detail_transaksi", (req,res) => {

    // prepare data
    let data = {
        kode_transaksi: req.body.kode_transaksi,
        kode_barang: req.body.kode_barang,
        jumlah: req.body.jumlah,
        harga_beli: req.body.harga_beli,
    }

    // create sql query insert
    let sql = "insert into detail_transaksi set ?"

    // run query
    db.query(sql, data, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message
            }
        } else {
            response = {
                message: result.affectedRows + " data inserted"
            }
        }
        res.json(response) // send response
    })
})

// end-point mengubah data detail transaksi
app.put("/detail_transaksi",(req,res) => {

    // prepare data
    let data = [
        // data
        {
            kode_transaksi: req.body.kode_transaksi,
            kode_barang: req.body.kode_barang,
            jumlah: req.body.jumlah,
            harga_beli: req.body.harga_beli,
        },

        // parameter (primary key)
        {
           kode_transaksi: req.body.kode_transaksi
        }
    ]

    // create sql query update
    let sql = "update detail_transaksi set ? where ?"

    // run query
    db.query(sql, data, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message
            }
        } else {
            response = {
                message: result.affectedRows + " data updated"
            }
        }
        res.json(response) // send response
    })
})

app.delete("/detail_transaksi/:kode",(req,res) => {
    // prepare data
    let data = {
        kode_transaksi: req.params.kode_transaksi
    }

    // create query sql delete
    let sql = "delete from detail_transaksi where ?"

    // run query
    db.query(sql, data, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message
            }
        } else {
            response = {
                message: result.affectedRows + " data deleted"
            }
        }
        res.json(response) // send response
    })
})

// endpoint ambil data detail transaksi
app.get("/detail_transaksi", (req, res) => {
    // create sql query
    let sql = "select * from detail_transaksi"

    // run query
    db.query(sql, (error, result) => {
        if (error) throw error
        res.json({
            data: result,
            count: result.length
        })
    })
})





// konfigurasi sarver =======================================================================================================================================


app.listen(8000, () =>{
    console.log("Server run on port 8000");
})
