(function($) {
	$(document).on('click','#enter-button',function(){
		$.ajax({
			url: '/checkin/',
			type: 'GET',
		})
		.done(function(result) {
			window.location.href = '/room/' + result.rid + '?creater=' + result.creater;
		})
		.fail(function() {
			console.log("error");
		});
	});
})(jQuery);