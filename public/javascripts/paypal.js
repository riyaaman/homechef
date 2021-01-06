paypal
    .Buttons({
        style: {
            color: "blue",
            shape: "pill",
            width: "200px",
            size: "small",
        },
        createOrder: function (data, actions) {
            var total = null;
            var total = document.getElementById("cart_total").value;
            return actions.order.create({
                purchase_units: [
                    {
                        amount: {
                            currency_code: "USD",
                            value: total,
                        },
                    },
                ],
            });
        },
        onApprove: function (data, actions) {
            var order_id = document.getElementById("order_id").value;
            return actions.order.capture().then(function (details) {
                console.log(details);
                location.href = "/order_paypal_success/" + order_id;
            });
        },
        onCancel: function (data) {
            location.href = "/order_paypal_cancel";
        },
        //}).render('body');
    })
    .render("#paypal-button-container");
