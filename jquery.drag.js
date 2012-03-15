(function($) {
    $.fn.html5drag = function(action,options) {   
    	//Initialisation
        var settings = {
        		action 	  : "all",
        		swappable : false
        };   
        
        var opts = $.extend(settings, options);

        jQuery.event.props.push('dataTransfer'); // on remonte la propriété dataTransfer pour éviter d'aller la chercher dans event.target.originalEvent au lieu de event.target
		
        // création des éléments déplacables
        function createDraggableElement(){
        	
			var draggable = $(this);
			
			draggable.prop("draggable",true);
			// Traitement du déplacement
			
			draggableEvent(draggable);
        }

		//création des conteneurs
		function createDroppableElement(){
			
			var droppable = $(this);
			
			droppable.attr("dropzone",opts.action);
			
			//fonction entrer survol de la cible
			function dragenter(event){
				event.preventDefault(); //autoriser le dépot
			}

			//fonction sortie survol de la cible
			function dragleave(event){
			}

			//fonction pour le survol du conteneur
			function dragover(event){
				event.dataTransfer.dropEffect=opts.action; //effet du drag & drop
				event.preventDefault(); //autoriser le dépot
				return false;
			}

			// Traitement du dépot
			function drop(event){
				event.preventDefault(); //autorise le dépot
				
				var id = event.dataTransfer.getData("Text"),
					elem = $("#"+id),
					dropzone = searchDropzone(event.target.id);
				if(opts.swappable){ //on échange les éléments
					var origin = $(".origin");
					if(dropzone.attr("id")!=origin.attr("id")){
						var content = dropzone.children("[draggable='true']");
						dropzone.html(elem[0]);
						elem.attr("data-dropzone",dropzone.attr("id"));
						content.attr("data-dropzone",origin.attr("id"));
						origin.html(content).removeClass("origin");
						draggableEvent(content);
					}
				} else {	
					dropzone.append(document.getElementById(id)); // on ajoute l'élément déplacer
				}
			}
			
			// Évenement 
			droppable.on('dragenter', dragenter);
			droppable.on('dragleave', dragleave);
			droppable.on('dragover', dragover);
			droppable.on('drop', drop);
		}

		//création des éléments échangables
		function createSwappableElement(){
			
			var swappable = $(this),
				dropzone = swappable.parent();
				
			swappable.attr("data-dropzone",dropzone.attr("id")); //utiliser pour les éléments droppable et draggable puisse comniqué
			
			if(!dropzone.attr("dropzone"))
				dropzone.html5drag("droppable",{swappable:true});
			
			swappable.html5drag("draggable",{swappable:true});
		}
		
		//Style quant on utlise le drag & drop
		function moveStyle(){
			$("[dropzone]").toggleClass("hover");
		}
		
		//Fonction qui cherche l'élément droppable d'un élément draggable pour les élément swappable
		function searchDropzone(id){
			var dropzone = $("#"+id); 
			if(!dropzone.attr("dropzone")) // Si l'élément en target n'est pas le dépot on le cherche
				dropzone = dropzone.parent("[dropzone]");
			return dropzone;
		}
		
		function draggableEvent(draggable){
			function dragstart(event){
				event.dataTransfer.effectAllowed=opts.action; //on accepte tout
				event.dataTransfer.setData("Text",event.target.id);//on transfert l'id du bloc a déplacé
				moveStyle(); // on change le style
				if(opts.swappable) //Si on doit échanger les dépots on ajoute la classe origin pour se souvenir de l'emplacement et pouvoir l'utiliser une fois l'élément déposé
					$("#"+draggable.attr("data-dropzone")).addClass("origin");
			}
			
			//Arret du déplacement
			function dragend(event){
				moveStyle(); // on enlève le style
				var dropzone = searchDropzone(event.target.id); // on cherche la zone droppable
					
				if(draggable.attr("data-dropzone")==dropzone.attr("id"))
					$(".origin").removeClass("origin")
					
			}
			
			// Évenement 
			draggable.on('dragstart', dragstart);
			draggable.on('dragend', dragend);
		}
		
		//création des éléments
		switch(action){
			case "draggable": this.each(createDraggableElement);
							  break;
			case "droppable": this.each(createDroppableElement);
							  break;
			case "swappable": this.each(createSwappableElement);
							  //createDroppableTemp
							  break;
			default : 		  console.log("Vous avez oublié de spécifier le type de votre element");
		}

        // interface fluide
        return this;
        
    };  
})(jQuery);