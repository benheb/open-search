//! open-search.js
//! version : 0.01
//! author : Brendan Heberton
//!license : MIT 
(function(window){
  'use strict';

  var OpenSearch = function OpenSearch( container, options ) {
    console.log('init Search, options: ', options);
    var self = this;

    //store options 
    this.options = options;

    //UI defaults 
    this.width = options.width || 239;
    this.height = options.height || 'auto';
    this.container = container;
    this._handlers = {};

    this.shapes = {
      "esriGeometryPolyline": "Polylines",
      "esriGeometryPolygon": "Polygons",
      "esriGeometryPoint": "Points"
    }
    
    this._buildUI(); 
  }

  OpenSearch.prototype._buildUI = function() {

    var container = document.getElementById( this.container );
    var innerContainer = document.createElement( 'div' );
    container.appendChild( innerContainer ).id = 'open-search';

    var header = document.createElement( 'div' );
    innerContainer.appendChild( header ).id = 'open-search-header';
    header.innerHTML = 'Open Search';

    var content = document.createElement( 'div' );
    innerContainer.appendChild( content ).id = 'open-search-content';

    var input = this._createElement('input', content, 'open-search-input', '', '');
    input.placeholder = 'Search ArcGIS Open Data';

    var loaderContainer = this._createElement('div', content, 'open-search-loader-container', '', 'open-search-loader-container');
    this._createElement('div', loaderContainer, 'open-search-loader', '', 'open-search-loader');

    var resultsContainer = this._createElement('div', content, 'open-search-results-container', '', '');

    this._createElement('div', resultsContainer, 'open-search-meta', '', '');

    this._createElement('ul', resultsContainer, 'open-search-results-list', '', '');
    
    this._idEventBuilder('keydown', 'open-search-input', '_onSearchKeyup' );
    this._idEventBuilder('scroll', 'open-search-results-list', '_onScroll' );

  }




  OpenSearch.prototype._buildResultList = function(res) {
    var containerHeight = document.getElementById('open-search').clientHeight;
    document.getElementById( 'open-search-results-container' ).style.height = containerHeight - 82 + 'px';
    document.getElementById( 'open-search-results-list' ).style.height = containerHeight - 110 + 'px';

    console.log('results', res);
    var self = this;
    this.results = res;

    var metael = document.getElementById( 'open-search-meta' );
    var q = res.metadata.query_parameters;
    var meta = 1 + '–' + q.per_page * q.page + ' of ' 
      + res.metadata.stats.total_count.toLocaleString();
    metael.innerHTML = meta;


    var el = document.getElementById('open-search-results-list');
    el.innerHTML = '';

    var result;
    if ( res.data.length ) {
      res.data.forEach(function(r, i) {
        self._addResultCard(r, i, el);
      }); 
    } else {
      result = document.createElement( 'li' );
      el.appendChild( result ).className = 'open-search-result open-search-empty';
      var val = document.getElementById('open-search-input').value;
      result.innerHTML = 'Sorry, your search for "'+val+'" turned up empty &#9785;';
    }

    this._classEventBuilder('click', 'open-search-result', '_onResultClick' );
    this._classEventBuilder('dragstart', 'open-search-result', '_onDragStart' );

  }




  OpenSearch.prototype._addResults = function(res) {
    var self = this;
    this.results = res;

    var metael = document.getElementById( 'open-search-meta' );
    var q = res.metadata.query_parameters;
    var total = res.metadata.stats.total_count;
    var thru = q.per_page * q.page;
    if ( thru >= total ) thru = total;
    var meta = 1 + '–' + thru + ' of ' + total.toLocaleString();
    metael.innerHTML = meta;


    var el = document.getElementById('open-search-results-list');

    var result;
    res.data.forEach(function(r, i) {
      self._addResultCard(r, i, el);
    });

    this._classRemoveEventListeners('dragstart', 'open-search-result', '_onDragStart' );
    this._classEventBuilder('dragstart', 'open-search-result', '_onDragStart' );

  }



  OpenSearch.prototype._addResultCard = function(r, i, el) {
    var self = this;

    var exists = document.getElementById(r.id);
    if ( exists ) { return; }

    var result = document.createElement( 'li' );
    el.appendChild( result ).className = 'open-search-result';
    result.id = r.id;
    result.title = r.url +','+ r.id;
    result.draggable = true;

    var resultLeft = self._createElement('div', result, 'open-search-result-left-'+r.id, '', 'open-search-result-left');

    var thumb = self._createElement('img', resultLeft, 'open-search-result-img-'+r.id, '', 'open-search-result-img');
    thumb.src = r.thumbnail_url;
    
    var resultRight = self._createElement('div', result, 'open-search-result-right-'+r.id, '', 'open-search-result-right');

    self._createElement('div', resultRight, 'open-search-result-title-'+r.id, r.name, 'open-search-result-title');
    self._createElement('div', resultRight, 'open-search-result-desc-'+r.id, r.description.replace(/<\/?[a-z][a-z0-9]*[^<>]*>/ig, ""), 'open-search-result-desc');
    
    var geom = ( self.shapes[r.geometry_type] ) ? self.shapes[r.geometry_type] : 'Features';
    var statContainer = self._createElement('div', resultRight, 'open-search-stat-container-'+r.id, '', 'open-search-result-stat-container');
    self._createElement('div', statContainer, 'open-search-stat-'+r.id, r.record_count.toLocaleString(), 'open-search-result-stat');
    self._createElement('div', statContainer, 'open-search-stat-title-'+r.id, geom, 'open-search-stat-title');

    var statContainer = self._createElement('div', resultRight, 'open-search-quality-container-'+r.id, '', 'open-search-result-stat-container');
    self._createElement('div', statContainer, 'open-search-quality-'+r.id, r.quality, 'open-search-result-stat');
    self._createElement('div', statContainer, 'open-search-quality-title-'+r.id, 'Quality Score', 'open-search-stat-title');

  }



    /*
  * creates a generic element, and appends to 'parent' div 
  * @param {String}   type of HTML element to create 
  * @param {String}   parent element to append created element to 
  * @param {String}   id of newly created element 
  * @param {String}   any text one wishes to append to new element 
  * @param {String}   optional classname for new element 
  */
  OpenSearch.prototype._createElement = function(type, parent, id, html, className ) {

    var el = document.createElement( type ); 
    parent.appendChild( el ).id = id;
    el.innerHTML = html;
    document.getElementById( id ).className = className;

    return el;
  }




  /*
  * Event builder for classes 
  * @param {String}     eventName, type of event 
  * @param {String}     className, what element class are we binding to
  * @param {String}     fnName, what action (function to call) when event fires 
  *
  */
  OpenSearch.prototype._classEventBuilder = function(eventName, className, fnName ) {
    var self = this; 
    
    var linkEl = document.getElementsByClassName( className );
    for(var i=0;i<linkEl.length;i++){
      if(linkEl[i].addEventListener){
        linkEl[i].addEventListener( eventName , function(e) { self[ fnName ].call(self, e) });
      } else {
        linkEl[i].attachEvent('on'+eventName, function(e) { self[ fnName ].call(self, e) });
      }
    }

  }



  OpenSearch.prototype._classRemoveEventListeners = function(eventName, className, fnName ) {
    var self = this; 
    
    var linkEl = document.getElementsByClassName( className );
    for(var i=0;i<linkEl.length;i++){
      if(linkEl[i].removeEventListener){
        linkEl[i].removeEventListener( eventName , function(e) { self[ fnName ].call(self, e) });
      }
    }

  }



  /*
  * Event builder for ids 
  * @param {String}     eventName, type of event 
  * @param {String}     id, what element are we binding to
  * @param {String}     fnName, what action (function to call) when event fires 
  *
  */
  OpenSearch.prototype._idEventBuilder = function(eventName, id, fnName ) {
    var self = this; 
    
    var linkEl = document.getElementById( id );
    if(linkEl.addEventListener){
      linkEl.addEventListener(eventName, function(e) { self[ fnName ].call(self, e) });
    } else {
      linkEl.attachEvent('on'+eventName, function(e) { self[ fnName ].call(self, e) });
    }

  }



  OpenSearch.prototype.search = function(e, page) {
    var self = this;
    
    this.value = ( e ) ? e.target.value : this.value;

    document.getElementById( 'open-search-loader-container' ).style.display = 'block';
    if ( !page ) {
      var el = document.getElementById('open-search-results-list');
      el.innerHTML = '';

      var metael = document.getElementById( 'open-search-meta' );
      metael.innerHTML = '';
    }

    function reqListener () {
      var res = JSON.parse(this.responseText);
      if ( page ) {
        self._addResults(res);
      } else {
        self._buildResultList(res);
      }
      document.getElementById( 'open-search-loader-container' ).style.display = 'none';
    }

    var url;
    if ( page ) {
      url = 'http://opendata.arcgis.com/datasets.json?q='+this.value+'&page='+page+'&sort_by=relevance';
    } else {
      url = 'http://opendata.arcgis.com/datasets.json?q='+this.value+'&sort_by=relevance'
    }

    var oReq = new XMLHttpRequest();
    oReq.onload = reqListener;
    oReq.open('get', url, true);
    oReq.send();

  }




  OpenSearch.prototype.searchResultClick = function(e) {
    var url = e.target.title;
    this.emit( 'search-result-selected', url );
  }


  OpenSearch.prototype.drag = function(e) {
    e.dataTransfer.setData("text", e.target.title);
  }


  OpenSearch.prototype.scroll = function(e) {
    if ( e.target.scrollTop + e.target.clientHeight >= e.target.scrollHeight ) {
      this.search(null, this.results.metadata.query_parameters.page + 1);
    }
  }


  /************* EVENTS **************/

  /*
  * Register Malette events 
  * 
  */
  OpenSearch.prototype.on = function(eventName, handler){
    this._handlers[ eventName ] = handler; 
  };


  // trigger callback 
  OpenSearch.prototype.emit = function(eventName, val) {
    if (this._handlers[ eventName ]){
      this._handlers[ eventName ](val);
    }
  };


  OpenSearch.prototype._onSearchKeyup = function(e) {
    if ( e.which == 13 ) {
      this.search(e);
    }
  }

  OpenSearch.prototype._onResultClick = function(e) {
    this.searchResultClick(e);
  }

  OpenSearch.prototype._onDragStart = function(e) {
    this.drag(e);
  }

  OpenSearch.prototype._onScroll = function(e) {
    this.scroll(e);
  }


  window.OpenSearch = OpenSearch;

})(window);