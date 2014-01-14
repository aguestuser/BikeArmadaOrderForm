/* processOrderForm.js: http://brooklynbikearmada.com/scripts/processOrderForm.js
/ 	dependencies: 
/	* jQuery: http://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js 
/	* openGeocoder.js: http://brooklynbikearmada.com/scripts/openGeocoder.js
/	* validate.js: http://ajax.aspnetcdn.com/ajax/jquery.validate/1.11.1/jquery.validate.js
*/

//GLOBAL VARIABLES

var donation = false,
	rush = false,
	outOfRange = false,
	lateNight = false,
	addOn = false,
	paymentMethod = '',
	validAddress = false;
	
//MAIN FUNCTION
function processOrderForm(){

	jQuery(document).ready(function($){
			
		var $form = $('#ss-form');
		prepFields();
		detectHiddenVals();
		submitIfValid($form);
		
	});	
};	

//HELPER FUNCTIONS

function prepFields(){
	
	var reqFields = {
		name: {tag: 'input', name: 'entry.1435501357'},
		date:{tag: 'input', name: 'entry.448789933'},
		streetNumber: {tag: 'input', name: 'entry.1858643763'},
		apartmentNumber: {tag: 'input', name: 'entry.301402882'},
		city: {tag: 'input', name: 'entry.1557860690'},
		state:{tag: 'select', name: 'entry.1617053665'},
		zip: {tag: 'input', name: 'entry.743356263'},
		phone: {tag: 'input', name: 'entry.1759796835'},
		email: {tag: 'input', name: 'entry.232186884'},
		csa: {tag: 'select', name: 'entry.1691508623'},
		shares: {tag: 'input', name: 'entry.230023227[]'},
		deliveryWindow: {tag: 'input', name: 'entry.1528132682'},
		payment: {tag: 'input', name: 'entry.964302445'}
	};


	var oldReqFields = {
			name: {tag: 'input', name: 'entry.1084170179'}, 
		    date: {tag: 'input', name: 'entry.91730232'},
		    address: {tag: 'textarea', name:'entry.1380601483'},
			phone: {tag: 'input', name:'entry.194277381'},
		    email: {tag: 'input', name: 'entry.2129911718'},
		    csa: {tag: 'select', name: 'entry.1740669868'},
		    shares: {tag: 'input', name: 'entry.1083611347[]'},
		    constraints: {tag: 'input', name: 'entry.1244229730'},
		    payment: {tag: 'input', name: 'entry.1518523847'}
		};
	
	for (var i in reqFields){
		var selector = reqFields[i]['tag'] + '[name="' + reqFields[i]['name'] + '"]';
		$(selector).addClass('req');/*.css('color', 'black');*/
		$('.ss-form-entry').has(selector).find('.ss-q-title').append('<span class="ss-form-notification">*</span>');
	}

};

function detectHiddenVals(){
	detectDonation();
	detectAddOn();
	detectPaymentMethod();
};

//show donation notice iff selected CSA has donation fee
function detectDonation(){
	// array of all CSA's with $2 donation fees
	var donationCsas = ['Crown Heights Farm Share'];
	$('#entry_1691508623').change(function(){
		// if the inputted CSA has a donation, display an extra fee notice and store that info to a local variable
		if (donationCsas.indexOf($(this).val()) > -1){ // checks if selection is in donationCsas[]
			var csa = $(this).val();
			$('#donation-notice').append('<div class="ss-form-notification">NOTE: Deliveries for ' + csa + ' include an extra $2 fee, which is given as a donation to the CSA\'s subsidy program for shares for low-income households.</div>');
			donation = true;
		} else {
			$('#donation-notice').empty();
			donation = false;
		}
	// callback
	setHiddenVals();				
	});
};
		
//show late policy notice iff a late delivery is requested
function detectAddOn(){
	detectLateNight();
	detectRush();
	detectOutOfRange();
};
	
function detectLateNight(){
	//store time constraint input to local variable and display appropriate added fee messages
	$('input:radio.late-night-time').click(function(){		
		if ($(this).val() === 'No time constraints'){	
			$('#late-night-notice').empty();
			lateNight = false;
		} else if ($(this).val() === '10pm-12am') {
			$('#late-night-notice').append('<div class="ss-form-notification">NOTE: You will be charged an extra $5 for late night orders.</div>');
			lateNight = true;					
		}
		//callback chain: setAddon() -> setHiddenVals()
		setAddOn();
	});
};

function detectRush(){
	// store requested delivery time to local variable, get current time
	$('#entry_448789933').change(function(){
		var orderTime = new Date($(this).val() + ' EDT'),
			currentTime = new Date();
		// if the current time is after 4pm on the same day the delivery is being requested for, it's a rush order. display fee notices and set variables accordingly
		if (
			(currentTime.getHours() >= 16) && 
			(currentTime.getMonth() === orderTime.getMonth()) && 
			(currentTime.getDate() === orderTime.getDate())
		){
			$('#rush-notice').append('<div class="ss-form-notification">NOTE: You are requesting an order after 4pm on the same day of your CSA Pickup. A $5 rush order fee will apply.</div>');
			rush = true;
		} else {
			$('#rush-notice').empty();
			rush = false;
		}	
		//callback chain: setAddon() -> setHiddenVals()
		setAddOn();
	});
};

function detectOutOfRange(){
	$('#entry_743356263').blur(function(){
		// store inputted address to local variable
		var address = $('#entry_1858643763').val() + ', Brooklyn, NY ' + $(this).val(),
		// polygon delimiting crown heights (the perimeter of the delivery range)
			range = [
				{lat:40.68395753777234, lng:-73.97742748260498}, 
				{lat:40.663061380941045, lng:-73.96240711212158}, 
				{lat:40.6632892559703, lng:-73.96103382110596}, 
				{lat:40.664233301369194, lng:-73.94562721252441}, 
				{lat:40.663517130221024, lng:-73.93373966217041}, 
				{lat:40.663517130221024, lng:-73.93095016479492}, 
				{lat:40.67582118362192, lng:-73.9026689529419}, 
				{lat:40.67858765545932, lng:-73.95227909088135}, 
				{lat:40.68395753777234, lng:-73.97742748260498}
			]; 
		//set range value in custom geocoder object, submit geocode request for address inputed by user 
		geocoder.range.setRange(range);
		geocoder.request(address);
		//if address can't be geocoded, display error message and set addressValid to false to prevent form submission 
		if (geocoder.result.error.length > 0){
			validAddress = false;
			addressChecked = true;
			//append a notification of invalid address if it doesn't already exist
			$('#invalid-address-notice:not(:has(".ss-form-notification"))').append('<div class="ss-form-notification">Please enter a valid address: exclude cross streets and include borough, state, and zip code.</div>');
			//clear any out-of-range notices
			$('#out-of-range-notice').empty();
		// if address can be geocoded... 
		} else {
			// clear any invalid address notices and store info in local variable so form can submit
			$('#invalid-address-notice').empty();
			validAddress = true;
			// if the address is outside of Crown Heights, append an out-of-range notice and store that info to a local variable to be used in setHiddenVals()
			if (!geocoder.result.isInRange()){
				$('#out-of-range-notice:not(:has(.ss-form-notification))').append('<div class="ss-form-notification">NOTE: You are requesting a delivery outside of Crown Heights. A $5 out-of-range fee will apply.  Also note: we cannot offer standard delivery windows for out-of-range deliveries but can guarantee delivery before midnight.</div>')
				outOfRange = true;
			// otherwise, clear out-of-range notices and set local variables to indicate the order is within ranges
			} else {
				$('#out-of-range-notice').empty();
				outOfRange = false;
			}
		}
		//callback chain: setAddon() -> setHiddenVals()		
		setAddOn();		
	});
};

function setAddOn(){
	if ( lateNight || rush || outOfRange ){
		addOn = true;
	} else {
		addOn = false;
	}
	setHiddenVals();
};			


function detectPaymentMethod(){ 	
	$('input:radio.payment-method').click(function(){
		paymentMethod = $(this).val().toLowerCase();
		if (paymentMethod == 'credit card'){
			$('#paypal-notice').append('<div class="ss-form-notification">NOTE: You will be charged a credit card procesing fee of $0.30 plus 2.9% the value of your order. (This is PayPal\'s rate.).</div>')
		} else {
			$('#paypal-notice').empty();
		}
	setHiddenVals();
	});
};

function setHiddenVals(){
	$('#donation').length == 0 ?
		$('#hidden-values').append('<input type="hidden" name="donation" id="donation" value="' + donation + '">') :
		$('#donation').replaceWith('<input type= "hidden" name ="donation" id="donation" value = "' + donation + '">');
	$('#lateNight').length == 0 ?
		$('#hidden-values').append('<input type= "hidden" name="lateNight" id="lateNight" value="' + lateNight + '">') :
		$('#lateNight').replaceWith('<input type= "hidden" name="lateNight" id="lateNight" value="' + lateNight + '">');
	$('#rush').length == 0 ?
		$('#hidden-values').append('<input type= "hidden" name="rush" id="rush" value="' + rush + '">') :
		$('#rush').replaceWith('<input type= "hidden" name="rush" id="rush" value="' + rush + '">');
	$('#outOfRange').length == 0 ?
		$('#hidden-values').append('<input type= "hidden" name="outOfRange" id="outOfRange" value="' + outOfRange + '">') :
		$('#outOfRange').replaceWith('<input type= "hidden" name="outOfRange" id="outOfRange" value="' + outOfRange + '">');	
	$('#addOn').length == 0 ?
		$('#hidden-values').append('<input type= "hidden" name="addOn" id="addOn" value="' + addOn + '">') :
		$('#addOn').replaceWith('<input type= "hidden" name="addOn" id="addOn" value="' + addOn + '">');
	$('#paymentMethod').length == 0 && paymentMethod != '' ?		
		$('#hidden-values').append('<input type= "hidden" id = "paymentMethod" name = "paymentMethod" value = "' + paymentMethod + '">') :
		$('#paymentMethod').replaceWith('<input type= "hidden" id = "paymentMethod" name = "paymentMethod" value = "' + paymentMethod + '">');
	setAmountOwed();	
};

function setAmountOwed(){
	// declare counting variables and map fees
	var count = 0,
		subtotal = 0,
		amountOwed = 0,
		bkbaFees = { 
			delivery: {
				description: 'basic delivery',
				selected: true,
				fee: 8
			},
			addOn: {
				description: 'special requests (rush orders, out-of-range deliveries, and late-night deliveries)',
				selected: false,
				fee: 5
			},
			donation: {
				description: 'donation to Crown Heights Farm Share\'s subsidized share program',
				selected: false,
				fee: 2
			}
		},
		paypalFees = {
			8: .54,
			10: .60,
			13: .69,
			15: .75
		};			
		// update bkbaFees according to inputted data
		if (addOn){
			bkbaFees.addOn.selected = true;
		}
		if (donation){
			bkbaFees.donation.selected = true;
		}
		// sum payment amount	
		for (var i in bkbaFees){
			if (bkbaFees[i].selected == true){
				count += bkbaFees[i].fee;
			}
		}
		subtotal = count;		
		// add paypal fee
		if (paymentMethod == 'credit card'){
			count += paypalFees[subtotal];
		}
		// set amount owed and display above submit button 
		amountOwed = count.toFixed(2);
		$('#amount-owed-notice').replaceWith('<div id="amount-owed-notice">AMOUNT OWED <br/><strong>You will owe a total of $' + amountOwed +' for this order.</strong></div>');
		$('#amountOwed').length == 0 ?
			$('#hidden-values').append('<input type= "hidden" name = "amountOwed" id="amountOwed" value = "' + amountOwed + '">') :
			$('#amountOwed').replaceWith('<input type= "hidden" name="amountOwed" id="amountOwed" value = "' + amountOwed + '">');
};

function submitIfValid($form){
			
	$.validator.addMethod(
    	'cReq', 
    	$.validator.methods.required, 
    	'This field is required.'
    );  
	$.validator.addClassRules(
		'req', {
			cReq: true
		}
	);
	
	$.validator.addMethod(
		'validAddress', 
		function(){
			return validAddress;	
		}, 
		'--'
	);

	$form.validate({
		rules: {
			'entry.1380601483': {
					validAddress: true
			}
		},
		errorClass: 'ss-form-notification',
		errorPlacement: function(error, element) {
		    error.appendTo(element.parents('.ss-form-entry'));
		},
		submitHander: function(){
			addressValid ? $form.submit() : e.preventDefault();
		},
		onfocusout: false
	});	
};