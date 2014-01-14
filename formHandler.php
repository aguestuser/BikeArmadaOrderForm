<!-- formHandler.php -->

<!DOCTYPE html>
<html>

<head>
</head>

<body>

<?php
	
//GLOBAL VARIABLES: 

	//store post data in $request array
	$request = $_POST;
	$response = null;
	
	//extract metadata from $request 
	$donation = $request['donation'];
	$add_on = $request['addOn'];
	$payment_method = $request['paymentMethod'];
	
	//convert shares data from array to string to pass to google
	$request['entry_1083611347'] = implode(', ', $request['entry_1083611347']);		
	
	//delete metadata variables from $request
	unset($request['donation'], $request['addOn'], $request['paymentMethod']);	

// MAIN FUNCTION:
		
	execute_curl();
	handle_response();

// HELPER FUNCTIONS:	

	function execute_curl(){
		global $request, $response;

		// initialize curl session
		$url = 'https://docs.google.com/forms/d/1FDJ_lSliKOvvCJXcSg9joITDtylUzFZDfL7_OmUBdDk/formResponse';
		//$user_agent = "Mozilla/5.0 (compatible; MSIE 5.01; Windows NT 5.0)";
		$ch = curl_init();
		
		//set curl options
		curl_setopt($ch, CURLOPT_POST, 1);
		curl_setopt($ch, CURLOPT_POSTFIELDS, $request);
		curl_setopt($ch, CURLOPT_URL, $url);
		//curl_setopt($ch, CURLOPT_USERAGENT, $user_agent);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1); //sets curl_exec to return the value of the 
		
		//store response and close curl session
		$response = curl_exec ($ch);
		curl_close ($ch);	
	}
	
	function handle_response(){
		global $response;
		//parse response to look for Google's success message; if success, then redirect, else raise error
		$success_str = 'Your response has been recorded.' ;
		if (strpos($response, $success_str) === false){
			handle_error();
		}
		else {
			handle_success();
		}
	}
	
	function handle_error(){
		echo '<div>Something went wrong with the submission of your form. Please <a href="http://brooklynbikearmada.com/booking">try again</a>. If the error persists, please email us at <a href="mailto:bkbikearmada@gmail.com">bkbikearmada@gmail.com</a> or call us at 347-450-5732.</div>';	
	}
	
	function handle_success(){
	global $donation, $add_on, $payment_method;	
	
		// map fees
		$bkba_fees = array (
					'delivery' => array (
									'description' => 'basic delivery',
									'selected' => true,
									'fee' => 8
									),
					'add_on' =>array (
									'description' => 'special requests (rush orders, out-of-range deliveries, and late-night deliveries)',
									'selected' => false,
									'fee' => 5
									),
					'donation' => array (
									'description' => 'donation to Crown Heights Farm Share\'s subsidized share program',
									'selected' => false,
									'fee' => 2
									)
					);	
		
		$paypal_fees = array (
						8 => array(
								'paypal_fee' => .54,
								'paypal_code' => '<form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
													<input type="hidden" name="cmd" value="_s-xclick">
													<input type="hidden" name="hosted_button_id" value="LZCNA6QMPU6HJ">
													<input type="image" src="https://www.paypalobjects.com/en_US/i/btn/btn_buynowCC_LG.gif" border="0" name="submit" alt="PayPal - The safer, easier way to pay online!">
													<img alt="" border="0" src="https://www.paypalobjects.com/en_US/i/scr/pixel.gif" width="1" height="1">
												</form>'
								),
						10 => array(
								'paypal_fee' => .60,
								'paypal_code' => '<form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
													<input type="hidden" name="cmd" value="_s-xclick">
													<input type="hidden" name="hosted_button_id" value="XURJSUWL7GARA">
													<input type="image" src="https://www.paypalobjects.com/en_US/i/btn/btn_buynowCC_LG.gif" border="0" name="submit" alt="PayPal - The safer, easier way to pay online!">
													<img alt="" border="0" src="https://www.paypalobjects.com/en_US/i/scr/pixel.gif" width="1" height="1">
												</form>'
								),
						13 => array(
								'paypal_fee' => .69,
								'paypal_code' => '<form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
													<input type="hidden" name="cmd" value="_s-xclick">
													<input type="hidden" name="hosted_button_id" value="L28GFEU5KJTQQ">
													<input type="image" src="https://www.paypalobjects.com/en_US/i/btn/btn_buynowCC_LG.gif" border="0" name="submit" alt="PayPal - The safer, easier way to pay online!">
													<img alt="" border="0" src="https://www.paypalobjects.com/en_US/i/scr/pixel.gif" width="1" height="1">
												</form>'
								),
						15 => array(
								'paypal_fee' => .75,
								'paypal_code' => '<form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
													<input type="hidden" name="cmd" value="_s-xclick">
													<input type="hidden" name="hosted_button_id" value="FHLR9RYAVE2RW">
													<input type="image" src="https://www.paypalobjects.com/en_US/i/btn/btn_buynowCC_LG.gif" border="0" name="submit" alt="PayPal - The safer, easier way to pay online!">
													<img alt="" border="0" src="https://www.paypalobjects.com/en_US/i/scr/pixel.gif" width="1" height="1">
												</form>'
								)
						);
						
		// update $bkba_fees according to form data
	
		if ($add_on){
			$bkba_fees['add_on']['selected'] = true;
		}
		if ($donation){
			$bkba_fees['donation']['selected'] = true;
		}
			
											
		// sum payment amount	
		foreach ($bkba_fees as $fee_type){
			if ($fee_type['selected'] === true){
				$count += $fee_type['fee'];
			}
		}
		$subtotal = $count;
		
		// add paypal fee
		if ($payment_method === 'credit card'){
			$count += $paypal_fees[$subtotal]['paypal_fee'];
		}
		$amount_owed = number_format($count, 2);
		
	

		// construct content block
		$tip_notice = '<p><strong>Note: while tips are never expected, they are always warmly appreciated! :)</strong></p>';
		
		$content = 
			'<p> Thank you for booking a delivery with the Brooklyn Bike Armada. You have elected to pay by ' . $payment_method . '. </p>
			<p><strong> Your charges total to $' . $amount_owed . ', which includes: </strong></p>
			<ul>';
			foreach ($bkba_fees as $fee_type){
				if ($fee_type['selected'] === true){
					$content .= '<li>$'. number_format($fee_type['fee'], 2)  .' - ' . $fee_type['description']. '.</li>';
				}
			}
			if ($payment_method === 'credit card'){
				$content .= '<li>$' . number_format($paypal_fees[$subtotal]['paypal_fee'], 2)  .' - credit card processing.</li>
						</ul>' . 
						$tip_notice . 
					'<p> Please click on the button below to complete your order via PayPal:</p>';
			
				switch ($amount_owed){
					case 8.54:
						$content .= $paypal_fees[8]['paypal_code'];
						break;
					case 10.60:
						$content .= $paypal_fees[10]['paypal_code'];
						break;
					case 13.69:
						$content .= $paypal_fees[13]['paypal_code'];
						break;
					case 15.75:
						$content .= $paypal_fees[15]['paypal_code'];
						break;
				}					
			} else {
				$content .= 
					'</ul>'. $tip_notice;
			}	
		$content .=  
			'<p>If you have any questions, please don’t hesitate to contact us at 347-450-5732 or <a href=mailto:bkbikarmada@gmail.com>bkbikarmada@gmail.com</a>.</p>';
		
		echo $content;	
		echo 
	}
	
?>

</body>
</html>