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

    this._createElement('div', content, 'open-search-loader', '', 'open-search-loader');

    var resultsContainer = this._createElement('div', content, 'open-search-results-container', '', '');

    var containerHeight = document.getElementById('open-search').clientHeight;
    document.getElementById( 'open-search-results-container' ).style.height = containerHeight - 85 + 'px';

    this._createElement('ul', resultsContainer, 'open-search-results-list', '', '');

    this._idEventBuilder('keydown', 'open-search-input', '_onSearchKeyup' );

  }




  OpenSearch.prototype._buildResultList = function(res) {
    console.log('results', res);
    var self = this;
    var el = document.getElementById('open-search-results-list');
    el.innerHTML = '';

    var result;
    if ( res.data.length ) {
      res.data.forEach(function(r, i) {
        result = document.createElement( 'li' );
        el.appendChild( result ).className = 'open-search-result';
        result.title = r.url +','+ r.id;
        result.draggable = true;

        self._createElement('div', result, 'open-search-result-title-'+r.id, r.name, 'open-search-result-title');
        self._createElement('div', result, 'open-search-result-desc-'+r.id, r.description, 'open-search-result-desc');
        self._createElement('div', result, 'open-search-result-feature-count-'+r.id, 'Features: '+r.record_count.toLocaleString(), 'open-search-result-feature-count');

      }); 
    } else {
      result = document.createElement( 'li' );
      el.appendChild( result ).className = 'open-search-result open-search-empty';
      var val = document.getElementById('open-search-input').value;
      result.innerHTML = 'Sorry, your search for "'+val+'" turned up empty &#9785; <br />Try again.';
    }

    this._classEventBuilder('click', 'open-search-result', '_onResultClick' );
    this._classEventBuilder('dragstart', 'open-search-result', '_onDragStart' );

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



  OpenSearch.prototype.search = function(e) {
    var self = this;
    var val = e.target.value;

    document.getElementById( 'open-search-loader' ).style.display = 'block';
    var el = document.getElementById('open-search-results-list');
    el.innerHTML = '';

    function reqListener () {
      var res = JSON.parse(this.responseText);
      self._buildResultList(res);
      document.getElementById( 'open-search-loader' ).style.display = 'none';
    }

    var oReq = new XMLHttpRequest();
    oReq.onload = reqListener;
    oReq.open('get', 'http://opendata.arcgis.com/datasets.json?q='+val+'&sort_by=relevance', true);
    oReq.send();

  }




  OpenSearch.prototype.searchResultClick = function(e) {
    var url = e.target.title;
    this.emit( 'search-result-selected', url );
  }


  OpenSearch.prototype.drag = function(e) {
    e.dataTransfer.setData("text", e.target.title);
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


  window.OpenSearch = OpenSearch;

})(window);