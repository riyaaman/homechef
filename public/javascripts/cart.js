// const { response } = require("express")
// const { post } = require("../../app")

//Product add to cart
function addToCart(proId,value) {

    var vendor_id = $("#vendorId").val();

    $.ajax({
        //url:'/add_to_cart/'+proId,
        url: "/add_to_cart",
        method: "post",
        data: {
            product_id: proId,
            ven_id: vendor_id,
            value:value
        },
        success: (response) => {
          
            if (response.status) {
               
                let count = $("#cart-count").html();
                if (!count) {
                    count = 0;
                }

                count = parseInt(count) + 1;
                $("#cart-count").html(count);
                count1 = $("#cart-count").val();               
                $(".successmsg").show();
                if(response.value==1){
                    location.href = "/cart";
                }
            }
            else{
                location.href = "/user_login";
            }
        },
    });
}

//Change the quantity of product
function changeQuantity(cartId, proId, userId, count) {
    let quantity = parseInt(document.getElementById(proId).innerHTML);
    $.ajax({
        url: "/change_product_quantity",
        data: {
            cart: cartId,
            product: proId,
            count: count,
            quantity: quantity,
            user: userId,
        },
        method: "post",
        success: (response) => {
            if (response.removeProduct) {
              
                location.reload();
            } else {
                document.getElementById(proId).innerHTML = quantity + count;
                document.getElementById("subtotal").innerHTML = response.total;
                document.getElementById("total").innerHTML = response.total + " Rs.";

                $("#cart-count").html(response.cart_count);
            }
        },
    });
}

//Product remove  from cart
function removeFromCart(cartId, proId) {
    $.ajax({
        url: "/remove_from_cart",
        data: {
            cart: cartId,
            product: proId,
        },
        method: "post",
        success: (response) => {
            //  if(response.cart==0){
            $("#cart-count").html(response.cart);
            location.reload();
            // }
        },
    });
}
