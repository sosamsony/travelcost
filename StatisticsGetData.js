var Group = ['MEACL', 'MPD', 'CQA', 'Press&Body', 'C&A', 'Paint', 'SKD'];
var userSettings ={};
var groupData ={};
var travelInfo = [];

$(function(){
	$('.collapse').collapse();
	$('.checkbox input').prop( 'checked', true);
	$('.radio input[value="Total"]').prop( 'checked', true);

	calendar();
	
	$('#UnselectAllCategories').on("click", function(){
		$('.checkbox :input').each(function(){
			this.checked = false;
		});
	});

	$('#SelectAllCategories').on("click", function(){
		$('.checkbox :input').each(function(){
			this.checked = true;
		});
	});

	$('#apply').on('click', function(){
		validate();
	});

	$('#cancel').on('click', function(){
		window.history.back();
	});
});

function calendar(){
	var start =  moment('2017-01-31').subtract(29, 'days');
	var end = moment();
	
	function cb(start, end){
		$('#dataUser span').html(start.format('YYYY-MM-DD') + ' - ' + end.format('YYYY-MM-DD'));
	}

	$('#dataUser').daterangepicker({
		autoApply: true,
		minDate: moment('2015/01/01'),
		maxDate: moment('2018/12/31'),
		startDate: start,
		endDate: end,
		ranges: {
			'2015': [moment('2015/01/01'), moment('2015/12/31')],
			'2016': [moment('2016/01/01'), moment('2016/12/31')],
			'2016': [moment('2016/01/01'), moment('2016/12/31')],
			'2017': [moment('2017/01/01'), moment('2017/12/31')],
			'2018': [moment('2018/01/01'), moment('2018/12/31')],
			'All tips': [moment('2015/01/01'), moment('2018/12/31')]
		}
	}, cb);
	cb(start, end);
}

function validate(){
	$('.error').removeClass('error');

	$('input[type="number"]').each(function(){
		 if ($(this).val() == '') $(this).addClass('error');
	});
	if (!$('.radio').find(':input:radio:checked').length > 0) $('.radio').addClass('error');
	if (!$('.checkbox').find(':input:checkbox:checked').length > 0) $('.checkbox').addClass('error');

	if ($('.error').length == 0){
		showDetails();
		$('#incorrect').closest('.alert').attr('hidden', 'hidden');
		return;
	}

	$('#incorrect').html('<strong>Please fill correct form!</strong>');
	$('#incorrect').closest('.alert').removeAttr('hidden')
}

function showDetails(){
	DisplayModalWorking();
	var counterCatregoiresLable = 0;
	travelInfo =[];
	userSettings ={};
		userSettings.StartDate = moment(($('#dataUser span').text()).substring(0,10));
		userSettings.EndDate = moment(($('#dataUser span').text()).substring(13));	
		userSettings.Target = parseInt($('input[name="Target"]').val())
		userSettings.PlusTolerance = parseInt($('input[name="PlusTolerance"]').val());
		userSettings.MinusTolerance = parseInt($('input[name="MinusTolerance"]').val());
	
	groupData ={'MEACL' :[{}], 'MPD' :[{}], 'CQA' :[{}], 'Press&Body' :[{}], 'C&A' :[{}], 'Paint' :[{}], 'SKD' :[{}]};

	var DeferredGetData = new $.Deferred();
	getDataAjax(DeferredGetData);

	$.when(DeferredGetData).done(function(ajaxData = []){
		travelInfo = ajaxData.filter(function(n){
			if (moment(n.StartDate).isAfter(userSettings.StartDate) && moment(n.EndDate).isBefore(userSettings.EndDate)) return true;
		});

		if(travelInfo.length == 0) return DisplayModalFail('No any trips in select date!');
		graphTotalCost($('#GraphCategorie').find("input:checked").val());
		topCountry();
		
		$('#LinkCateogires').html('');
		$('#CostCategories').find("input:checked").map(function(){
			counterCatregoiresLable +=1;
			calculateCost($(this).val()); 
			displayInterface($(this).val());
		});
		$('#CountCategories').text(counterCatregoiresLable);
		$('#LinkCateogires').find('li').bind('click', function(){
			var dataHref = $(this).children().prop('href');
			$(this).siblings().removeClass('active');
			$(this).addClass('active');
			displayInformation(dataHref.slice(dataHref.indexOf('#')+1))
		});
		$('#ModalInfo .close').click();
		$('#LinkCateogires li:first-child').click();
	}).fail(function(error){
		return DisplayModalFail('No any trips in select date!');
	});
}

function getDataAjax(DeferredGetData){
	var oDataUrl = "https://raw.githubusercontent.com/KowalikMichal/TravelCostDashboard/master/generated.json";

	$.ajax({
		async: false,
		url: oDataUrl,
		type: "GET",
		cache: true,
		dataType: "json",
		headers: {
			"accept": "application/json;odata=verbose"  
		},
		success: function(data){
			return DeferredGetData.resolve(data);
		},
		error: function(data, errMessage){
			return DeferredGetData.reject(errMessage);
		}
	});
}

function displayInterface(userChoice){
	$('#tripsNumber').text(travelInfo.length);
	$('#tripsJoined').text(travelInfo.filter(function(n){if(n.Join !== null)return n}).length);
	$('#totalCost').text(
		$.map(travelInfo, function(element){
			var returnValue = ~~element['Avis'] + ~~element['Booking'] +~~element['Hotel'] + ~~element['PerDiem'] +~~element['Plane'] +~~element['Poolcar'] + ~~element['Taxi'];
			return returnValue;
		}).reduce(function(p,n){
			return ~~p+~~n;
		}).toLocaleString()
	);
	$('#basicInfo').removeAttr('hidden');
	$('#LinkCateogires').append('<li><a href="#'+userChoice+'">'+userChoice+'</a></li>');
	$('#divCalculatedCost').removeAttr('hidden');
}

function calculateCost(selectCategories){
	$.each(groupData, function(index){
		calculateGroupCost(index, selectCategories);
		calculateGroupCost(index, 'Join');
		calculateGroupCost(index, 'NumerOfTrips');
	});
}

function calculateGroupCost(group, key){
	if (key == 'Join') groupData[group][0][key] = (travelInfo.filter(function(n){if(n['Group'] == group && n.Join !== null)return n}).length);
	else if (key == 'NumerOfTrips') groupData[group][0][key] = (travelInfo.filter(function(n){if(n['Group'] == group)return n}).length);
	else if (key == 'Total') groupData[group][0][key] = ~~groupData[group][0]['Avis'] + ~~groupData[group][0]['Booking'] + ~~groupData[group][0]['PerDiem'] + ~~groupData[group][0]['Hotel'] + ~~groupData[group][0]['Poolcar'] + ~~groupData[group][0]['Plane'] + ~~groupData[group][0]['Taxi'];
	else groupData[group][0][key] = $.map(travelInfo, function(n){if (n['Group']== group) return n[key];}).reduce(function(previous, current){return previous+current}, 0);
}

function displayInformation(display){
	$('#groupDetailsToal').html('');
	var detailsTabeleRow = null;
	var sumarycost = null;
		sumarycost  = $.map(Group, function(index){return groupData[index][0][display];}).reduce(function(p, n){return p+n;});
	$.each(Group, function(index){
		$.map(groupData[Group[index]], function(n){
			detailsTabeleRow += ('<tr><td data-title="Dept.">'+Group[index]+'</td><td data-title="Number of trips">'+n.NumerOfTrips+'</td><td data-title="Joined trips">'+n['Join']+'</td><td data-title="'+display+'">'+(isNaN(n[display]) ? 0 : n[display].toLocaleString())+'</td><td data-title="[%]">'+((isNaN(n[display]/sumarycost)) ? 0: (n[display]/sumarycost*100).toLocaleString())+'</td></tr>');
			});
	});

	$('#tableTextCategories').text(display+' in PLN');
	$('#GroupCost').find('tbody').html(detailsTabeleRow);
	$('#GroupCost').find('tfoot').html('<tr><td colspan="3"><b>Summary cost</b></td><td colspan="2">'+sumarycost.toLocaleString()+'</b></td>/tr>');
}

function graphTotalCost(categorie){
	var ctx = null;
	var barChart = null;
	var TotalCostGraph = {};
	var Tolerance = {'PlusTolerance' : 0, 'MinusTolerance':0};

	$('#graph').html('');
	$('#graph').append('<canvas id="graphTotalCost" class="shadow-depth-1"></canvas>');
	ctx = document.getElementById('graphTotalCost').getContext('2d');
		
	barChart = new Chart(ctx, {
		type: 'bar',
		data: {
			labels: Group,
		},
		options: {
			maintainAspectRatio: false,
			legend: {
				display: false
			},
			title: {
				display: true,
				text: 'Summary cost of ' + categorie
			},
			tooltips: {
				displayColors: false,
		  		callbacks: {
					label: function(tooltipItem, data) {
						var value = data.datasets[0].data[tooltipItem.index];
						return parseInt(value).toLocaleString();
					}
		  		}
			},  
		},
	});

	Tolerance.PlusTolerance = ((1+userSettings.PlusTolerance/100)*userSettings.Target); 
	Tolerance.MinusTolerance = ((1-userSettings.MinusTolerance/100)*userSettings.Target);

	for (var index in Group){
		var TotalCost = $.map(travelInfo, function(element){
			if (element.Group == Group[index]){
				if (categorie == 'Total'){
					var returnValue = ~~element['Avis'] + ~~element['Booking'] +~~element['Hotel'] + ~~element['PerDiem'] +~~element['Plane'] +~~element['Poolcar'] + ~~element['Taxi'];
					return returnValue;
				}
				else {
					return ~~element[categorie];
				}
			}
		});
		if (TotalCost.length > 0){
			TotalCost = TotalCost.reduce(function(p,n){
				return ~~p+~~n;
			});
		}
		else TotalCost = 0;
		TotalCostGraph[Group[index]] = TotalCost;
	}

	var data  = $.map(TotalCostGraph, function(n){
		return n.toFixed(2);
	});

	var color = $.map(data, function(n){
		return (n > Tolerance.MinusTolerance && n < Tolerance.PlusTolerance) ? 'rgb(60, 186, 159)':'rgb(255, 99, 132)'; //if value is between target color green else red
	});

	addData(barChart, color, data);
}

function addData(chart, color, data) {
	chart.data.datasets.push({
		type: 'bar',
		backgroundColor: color,
		data: data
	});

	chart.update();
}

function topCountry(){
	var TopCountry = {};
	var htmltopCountry;

	TopCountry= $.map(travelInfo, function(n){return (n.Destiantion.toUpperCase())}).reduce(function(obj, elem){
						obj[elem]=obj[elem] || 0;
						obj[elem]++;
						return obj;}, {});

	var sortTopCountry = sortProperties(TopCountry);
	for (var index in sortTopCountry){
		const country = sortTopCountry[index][0];
		const count = sortTopCountry[index][1]; 
		htmltopCountry += ('<tr><td>'+country+'</td><td>'+count+'</td></tr>');
	}

	$('#topCountry').find('tbody').html(' ');
	$('#topCountry').removeAttr('hidden');
	$('#topCountry').find('tbody').append(htmltopCountry);
}

function sortProperties(obj){
	var sortable=[];
	for(var key in obj)
		if(obj.hasOwnProperty(key))
			sortable.push([key, obj[key]]);
	sortable.sort(function(a, b){
	  return b[1]-a[1];
	});
	return sortable;
}

function DisplayModalWorking(){
	$('#ModalInfo').find('.icon-box').html(' ');
	$('#ModalInfo :button').hide()
	$('#ModalInfo').find('.icon-box').append('<div class="loader"></div>')
	$('#ModalInfo').find('.modal-header').addClass('Working');
	$('#ModalInfoBody').html('<h4>Working on it!</h4><p>Please give me a moment...</p>');
	$('#ModalInfo').modal({backdrop: "static"});
}

function DisplayModalFail(error){
	$('#ModalInfo :button').show();
	$('#ModalInfo').find('.icon-box').html('<i class="glyphicon glyphicon-remove"></i>');
	$('#ModalInfo').find('.modal-header').removeClass('Working').addClass('Error');
	$('#ModalInfoBody').html('<h4>Ooops!</h4><p>'+error+'</p>');
	$('#ModalInfo').modal()
}