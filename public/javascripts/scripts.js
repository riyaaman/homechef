
	
	function razorpayPayment(order) {

		var options = {

			"key": "rzp_test_P1qJn93ykpKDDb", // Enter the Key ID generated from the Dashboard
			"amount": order.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
			"currency": "INR",
			"name": "Crossroads",
			"description": "Test Transaction",
			"image": "https://example.com/your_logo",
			"order_id": order.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
			"handler": function (response) {

				//alert(response.razorpay_payment_id);alert(response.razorpay_order_id);alert(response.razorpay_signature);         
				verifyPayment(response, order)
			},
			"prefill": {
				"name": "Demo",
				"email": "demo@example.com",
				"contact": "9999999999"
			},
			"notes": {
				"address": "Razorpay Corporate Office"
			},
			"theme": {
				"color": "#3399cc"
			}
		};
		var rzp1 = new Razorpay(options);
		
		rzp1.open();
	}
	function verifyPayment(payment, order) {

		$.ajax({
			url: 'verify_payment',
			data: {
				payment,
				order
			},
			method: 'post',
			success: (response) => {
				alert(response.status)
				if (response.status) {
					location.href = '/order_success'
				}
				else {				
					alert("Payment Failed")
					location.href = '/order_paypal_cancel'
					
				}
			}
		})
	}


