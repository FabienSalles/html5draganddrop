/**************************************************************************
 *	fonction pour l'héritage avec prise en compte de surcharge de fonction
 *****************************************************************************/
function heriter(destination, source) {
	//fonction d'initialisation de la méthode super et du tableau __parent_methods
    function initClassIfNecessary(obj) {
        if( typeof obj["_super"] == "undefined" ) { 
            obj["_super"] = function() { 
                var methodName = arguments[0]; 
                var parameters = arguments[1];
                this["__parent_methods"][methodName].apply(this, parameters); 
            } 
        }
        if(obj["__parent_methods"] == null ) { 
            obj["__parent_methods"] = {} 
        } 
    }
	for (var element in source) {
		//Si l'élément existe
		if( typeof destination[element] != "undefined") {
			// Si c'est une fonction on la surcharge
			if(typeof destination[element]=="function"){ 
				initClassIfNecessary(destination); 
				destination["__parent_methods"][element] = source[element];
			//Si c'est un objet
			} else if(typeof destination[element]=="object"){
				//on l'étend mais on ne remplace rien si on trouve les même valeurs (utiliser pour ne pas supprimer les options)
				destination[element] = $.extend({},source[element],destination[element]);
			}
        } else
        	//on rajoute les element
            destination[element] = source[element]; 
    } 
} 

/*************************************************************
 *	S'assurer de la présence d'Object.create (introduit ds ES5)
 *************************************************************/
(function(){
    if (typeof Object.create === 'function') {
        return;
    }
    function F(){}
    Object.create = function( o ) {
        F.prototype = o;
        return new F();
    };
})();

/*********************
  *	Plugin html5drag
 ********************/
(function($) {
	$.fn.html5drag = function(action,options) {
        // On n'agit pas sur des élement absent - via conseils Paul Irish's (10 Things I learned)
        if(!this.length) {
            return this;
        }
        
        // on remonte la propriété dataTransfer pour éviter d'aller la chercher dans event.target.originalEvent au lieu de event.target
        jQuery.event.props.push('dataTransfer');
        
        return this.each(function() {
            // Création d'un nouvel objet via le prototypal Object.create
            var obj = null;
    		switch(action){
    			case "draggable": obj = Object.create(draggable);
    							  break;
    			case "droppable": obj = Object.create(droppable);
    							  break;
    			case "swappable": obj = Object.create(swappable);
    							  break;
    			default : 		  console.log("Vous avez oublié de spécifier le type de votre element");
    							  return;
    		}
    		
            // Appel de la fonction d'initialisation, note "constructeur" (kind of)                 
            obj.init(options, this); // this ici référence l'élement dom

            // Enfin, on attache l'instance de notre objet à notre élément DOM.
            $.data(this, action, obj); // ou $(this).data(Objet, obj) mais légérement moins performant

        });
    }
})(jQuery);

/**************************************************************************
 *	Objet DragAndDrop contenant les méthodes utilisé pour tous les éléments
 *************************************************************************/
var DragAndDrop = {
	///////////////////////////
	//options par defaut de l'objet
    options: {
    	action: "move",
		swappable : false,
		add : true
    },
	////////////////////////////////////////////
	//fontionne qui cherche l'élément droppable
	_searchDropzone: function(id){
		var dropzone = $("#"+id);
		// Si l'élément en target n'est pas le dépot on le cherche
		if(!dropzone.attr("dropzone")) 
			dropzone = dropzone.parent("[dropzone]");
		return dropzone;
	},
	/////////////////////////////////////////////////
	//changement du style quant on déplace un élément
    _moveStyleElement: function(swappable){
		if(swappable)
			$("[draggable=true]").toggleClass("dropzone");
		else
			$("[dropzone]").toggleClass("dropzone");
    }
};

/*********************
 *	Objet Draggable
 ********************/
var draggable = {
	///////////////////////////
	//initialisation de l'objet
    init: function(options, elem) {
	
        // Merge des options passés en paramétres avec les options par défaut
        // Nos fameux mixins options
        this.options = $.extend({},this.options,options);
        
        // Sauvegarde des référence de l'élement jQuery et de l'élement DOM
        this.element = $(elem);
        this.dom = elem;
        
        //Héritage de l'objet DragAndDrop
	    heriter(this, DragAndDrop);
	    
        // appel de méthode
        // préfixé par _ pour indiquer un état privé 'fictif'
        this._build();
        
    },
    //////////////////////
    // Début du déplacement
    _eventDragStart : function(e){
    	//on récupère notre objet
    	var self = e.data,
			target = $("#"+e.target.id);
    	//effet du drag and drop
		e.dataTransfer.effectAllowed=self.options.action;
		//on transfert l'id du bloc a déplacé
		e.dataTransfer.setData("Text",e.target.id);
		// on change le style
		self._moveStyleElement(self.options.swappable); 
		//Si on doit échanger les élement 
		if(self.options.swappable){
			// on ajoute la classe origin pour se souvenir de l'emplacement afin de remplacer l'élément s'électioner
			$("#"+self.element.data("dropzone")).addClass("origin"); 
			// Si l'élément sélectionné n'est pas le dernier
			var next = self.element.next().attr("id");
			if(next)
				// on ajoute un attribut contenant l'id de l'élément d'a coté pour savoir à quel endroit on viendra déposer l'autre élément
				self.element.attr("data-next",next);
		} 	
    },
    ////////////////////
    //fin du déplacement
    _eventDragEnd : function(e){
    	var self = e.data,
    		target = $("#"+e.target.id);
		self._moveStyleElement(self.options.swappable);
		// on cherche la zone droppable
		var dropzone = self._searchDropzone(e.target.id); 
		if(self.element.attr("data-dropzone")==dropzone.attr("id"))
			//Si on est dans le même dépot on enlève la classe
			$(".origin").removeClass("origin"); 
	},
    _eventHover: function(e){
    	var self = e.data;
    	self.element.toggleClass("elementhover");
    },
//    _eventMouseLeave : function(e){
//    	var self = e.data;
//    	self.element.toggleClass("hover");
//    },
//    _eventDragStart : function(e){
//    	e.data._super("_eventDragStart",arguments);
//    	console.log(e.data.__parent_methods._eventDragStart);
//		console.log("test");
//    },
    //////////////////////
    // création de l'objet
    _build: function(){
    	// attribut permettant de déplacer l'élément
    	this.dom.draggable=true; 
    	this.element
    	.on('dragstart',this,this._eventDragStart)
		.on('dragend',this, this._eventDragEnd)
    	.on('hover', this, this._eventHover);
    }
};

/***********************
 *	Objet Droppable
 *********************/
var droppable = {
    init: function(options, elem) {
        this.options = $.extend({},this.options,options);
        
        this.element = $(elem);
        this.dom = elem;
        
        heriter(this, DragAndDrop);

        this._build();
        
    },
    ///////////////////////////////////////////////////
    // L'élément d'aggrable entre dans l'élément droppable
    _eventDragEnter : function(e){
    	// ce paramètre permet d'autoriser le déplacement
    	if (e.preventDefault) { e.preventDefault();}
    	//celui ci fait la même chose pour IE
		return false; 
    },
    //////////////////////////////////////////////////
    // L'élément d'aggrable sort de l'élément droppable
    _eventDragLeave : function(e){
	},
	//////////
	// Survol
	_eventDragOver : function(e){
		if (e.preventDefault) { e.preventDefault();}
		var self = e.data;
		//effet du drag & drop
		e.dataTransfer.dropEffect=self.options.action;
		self._moveStyleHover(e.target.id);
		return false;
	},
	/////////
	//Dépot
	_eventDrop : function(e){
		if (e.preventDefault) { e.preventDefault();}
		
		var self = e.data;
		var dropzone = self._searchDropzone(e.target.id), //on cherche le dépot
			id = e.dataTransfer.getData("Text"), // on récupère l'id de l'élément déplacé
			elem = $("#"+id); //element déposé

		//si on fait un échange
		if(self.options.swappable){
			var origin = $(".origin"),// on récupère l'origine pour lui ajouté l'élément visé
				target = $("#"+e.target.id), //on récupère l'élément visé
				sameDropZone = dropzone.attr("id")==origin.attr("id"); //booléen qui renvoie true si on est dans le même dépot
			
			//on n'a plus besoin de cette classe
			origin.removeClass("origin");
			
			//si l'élément que l'on vise est un élément déplacable
			if(e.target.draggable){
				
				if(!sameDropZone){
					//on remplace l'origine des éléments
					target.attr("data-dropzone",origin.attr("id"));
					elem.attr("data-dropzone",dropzone.attr("id"));
				}
				
				//on remplace l'élément
				target.replaceWith(elem);
				
				// Si l'élément que l'on vient de déplacé n'était pas le dernier de son conteneur
				if(elem.attr("data-next")){
					//Si l'élément suivant est différent de l'élément visé
					if(elem.attr("data-next")!= target.attr("id"))
						// on place l'élément visé avant et on recrée l'élément déplaçable pour réinitilaiser les évènement
						target.insertBefore("#"+elem.attr("data-next")).html5drag("swappable");
					else{
						// on clone l'ancien élément et on le place avant le nouveau et on recrée l'élément déplaçable pour réinitilaiser les évènement
						target.clone().insertBefore(elem).html5drag("swappable");
					}
				} else{
					// sinon on place l'élément à la fin
					origin.append(target);
					// on recrée l'élément déplaçable pour réinitilaiser les évènement
					target.html5drag("swappable");
				}
					
			} else if(self.options.add){
				// on ajoute à la fin
				dropzone.append(elem);
				// on recrée l'élément déplaçable pour réinitilaiser les évènement et on change l'origine
				elem.html5drag("swappable").attr("data-dropzone",dropzone.attr("id"));
			}
			if(elem.attr("data-next"))
				// on supprime cette attribut qui est devenu inutile
				// on le sépare de l'autre condition pour être sur de supprimer cette attribut 
				// dans le cas ou l'objet en target n'est pas un élément draggable
				elem.removeAttr("data-next");
				
		}
		// si ne doit rien échangé ou si l'élément visé n'est pas un élément déplacable
		else if(self.options.swappable && !e.target.draggable && self.options.add || !self.options.swappable){
			// on ajoute à la fin
			dropzone.append(elem);
		}
			
		return false;
	},
	_moveStyleHover : function(id){
		$("#"+id).toggleClass("dropzonehover");
	},
    _build: function(){
    	this.element
    	.attr("dropzone",this.options.action)
    	.on('dragenter',this,this._eventDragEnter)
    	.on('dragleave',this, this._eventDragLeave)
    	.on('dragover',this, this._eventDragOver)
    	.on('drop',this, this._eventDrop);
    }
};


/*******************
 *  Objet Swappable
 ********************/
var swappable = {
	init: function(options, elem) {
	    this.options = $.extend({},this.options,options);
	    
	    this.element = $(elem);
	    this.dom = elem;
	    //l'élément parent de l'élément sélectionné devient l'élément droppable
	    this.dropzone = this.element.parent(); 
	    
	    this._build();
	},
	options:{
		swappable: true,
		add: false
	},
	 _build: function(){
		//utiliser pour les éléments droppable et draggable puisse comniqué
		this.element.attr("data-dropzone",this.dropzone.attr("id")); 
		
		if(!this.dropzone.attr("dropzone"))
			this.dropzone.html5drag("droppable",this.options);
		
		this.element.html5drag("draggable",this.options);
    }
}
