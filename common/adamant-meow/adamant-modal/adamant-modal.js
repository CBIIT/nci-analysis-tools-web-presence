$(document).ready(function() {
  if (!document.getElementById('adamant-modal')) {
    $.extend(true,$,{
      "adamant": {
        "modal": {
          "open": function(target) {
            target = $(target);
            var id = target.attr('id');
            if (id === undefined) {
              id = (new Date).getTime();
              $(target).attr('id',id)
            }
            target = $('<span adamant-modal-background="#'+id+'" '+(target.attr('adamant-modal-static') === undefined?'adamant-modal-close="#'+id+'"':'')+' />').insertBefore(target).add(target);;
            target.addClass('adamant-show');
            window.setTimeout(function() {
              target.addClass('adamant-fadein');
            },1);
          },
          "close": function(target) {
            target = $(target);
            var background = $('[adamant-modal-background][adamant-modal-background="#'+$(target).attr('id')+'"]');
            target.add(background).addClass('adamant-fadeout');
            window.setTimeout(function() {
              target.removeClass('adamant-show').removeClass('adamant-fadeout').removeClass('adamant-fadein');
              background.remove();
              target.trigger('adamant.modal.hidden');
            },1000);
          }
        },
        "location": "/common/adamant-meow/adamant-modal"
       }
    });
    $('<link href="'+$.adamant.location+'/adamant-modal.css" id="adamant-modal" rel="stylesheet" type="text/css" />').prependTo(document.head);
    var adamantModalStylesheet = document.createElement('style');
    document.head.appendChild(adamantModalStylesheet);
    adamantModalStylesheet = adamantModalStylesheet.sheet;
    adamantModalStylesheet.insertRule("@media(max-width:450px){[adamant-modal],[adamant-modal-static]{height:100%;top:0px;}}",0);
    var setHeight = function() {
      if ($(window).width() <= 450) {
        var rule = adamantModalStylesheet.cssRules;
        rule[rule.length-1].cssRules[0].style.height = $(window).height()+'px';
      }
    }
    var setTop = function() {
      if ($(window).width() <= 450) {
        var rule = adamantModalStylesheet.cssRules;
        rule[rule.length-1].cssRules[0].style.top = $(window).scrollTop()+'px';
      }
    };
    $('[adamant-modal].adamant-show,[adamant-modal-static].adamant-show').each(function() {
      var target = $(this).removeClass('adamant-show');
      window.setTimeout(function() {
        $.adamant.modal.open(target);
      },1);
    });
    $(document).on('click','[adamant-modal-close]',function() {
      var target = $($(this).attr('adamant-modal-background') || $(this).closest('[adamant-modal],[adamant-modal-static]') || $(this).attr('adamant-modal-close'));
      target.trigger('adamant.modal.hiding');
      $.adamant.modal.close(target);
    });
    $(document).on('click','[adamant-modal-target]',function() {
      $.adamant.modal.open($(this).attr('adamant-modal-target'));
    });
  }
  $(window).on('resize',function() { setHeight(); setTop(); }).on('scroll',setTop);
});
