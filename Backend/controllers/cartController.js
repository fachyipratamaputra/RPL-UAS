const db = require('../config/db');

exports.addToCart = async (req,res)=>{

    const id_user = req.user.id_user;

    const {
        id_product,
        jumlah
    } = req.body;

    try{

        const [cart] =
        await db.promise().query(
        'SELECT * FROM cart WHERE id_user=?',
        [id_user]
        );

        let id_cart;

        if(cart.length===0){

            const [newCart] =
            await db.promise().query(
            'INSERT INTO cart(id_user) VALUES(?)',
            [id_user]
            );

            id_cart=newCart.insertId;

        }else{
            id_cart=cart[0].id_cart;
        }

        await db.promise().query(
        `INSERT INTO cart_items
        (id_cart,id_product,jumlah)
        VALUES(?,?,?)`,
        [id_cart,id_product,jumlah]
        );

        res.json({
            message:'Produk masuk keranjang'
        });

    }catch(error){
        res.status(500).json({
            error:error.message
        });
    }
};