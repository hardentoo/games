
function drawEvents(evs,k) {
  var swapped = false

  function getWizard(who) {
    if (swapped) {
      who = who === 'caster' ? 'opponent' : 'caster'
    }

    return who
  }

  function getLoc(l) {
    return $('#' + getWizard(l.who) + '_' + l.slot)
  }

  function drawEvent(i) {
    if (i >= evs.length) {
      setTimeout(k,0)
      return
    }

    function next() { drawEvent(i+1) }

    var ev = evs[i]
    switch(ev.tag) {

      case 'say':
        console.log(ev.text)
        setTimeout(next,0)
        return

      case 'life':
        if (ev.amount === 0) {
          setTimeout(next,0)
          return
        }
        var t = $(getLoc(ev.loc))
        var pos = t.offset()
        var msg = $('<div/>')
                  .css('position','absolute')
                  .css('left',pos.left + 'px')
                  .css('top', pos.top + 'px')
                  .css('display','inline-block')
                  .css('color', ev.amount >= 0 ? 'green' : 'red')
                  .css('background-color', 'rgba(0,0,0,0.5)')
                  .css('z-index','200')
                  .css('font-size', '40px')
                  .css('border-radius','3px')
                  .css('padding','5px')
                  .text(ev.amount)
         $('body').append(msg)
         msg.animate({ left: "-=20px", top: "-=20px", opacity: '0' }
                    , 1000
                    , 'swing'
                    , next
                    )
         return

      case 'wizardLife':
        console.log(ev)
        var lab = $('#' + getWizard(ev.who))
        var pos = lab.offset()
        console.log(pos)
        var msg = $('<div/>')
                  .css('position','absolute')
                  .css('left',(pos.left + lab.width()/2) + 'px')
                  .css('top', pos.top + 'px')
                  .css('display','inline-block')
                  .css('color', ev.amount >= 0 ? 'green' : 'red')
                  .css('background-color', 'rgba(0,0,0,0.5)')
                  .css('z-index','200')
                  .css('font-size', '40px')
                  .css('border-radius','3px')
                  .css('padding','5px')
                  .text(ev.amount)
         $('body').append(msg)
         msg.animate({ left: "-=20px", top: "-=20px", opacity: '0' }
                    , 1000
                    , 'swing'
                    , next
                    )
 
        return


      case 'die':
        $(getLoc(ev.loc)).fadeOut(next)
        return

      case 'attack':
        var ch1 = "+=50px"
        var ch2 = "-=50px"
        getLoc(ev.loc).css('z-index','100')
                      .animate({left: ch1})
                      .animate({left: ch2}, next)
        return

      case 'swap':
        swapped = !swapped
        var d = $('<div/>')
                .text('Next Turn')
                .css('position','absolute')
                .css('left', '30%')
                .css('top', '30%')
                .css('background-color','white')
                .css('font-size','128px')
                .css('border','5px solid black')
                .css('z-index','500')

        $('body').append(d)
        d.animate({opacity: 0}, 1000, 'swing', function() {
          $('.deck.' + getWizard('caster')).removeClass('disabled')
          $('.deck.' + getWizard('opponent')).addClass('disabled')
          setTimeout(next,0)
        })

        return

      case 'summon':
        var n = drawArenaField(ev.card,getWizard(ev.loc.who),ev.loc.slot)
        getLoc(ev.loc).replaceWith(n)
        setTimeout(next,0)
        return

      case 'move':
        var tgt = getLoc(ev.to)
        var tgtPos = tgt.offset()
        var src = getLoc(ev.from).css('position','absolute')
        var id = tgt.attr('id')
        src.animate({left: tgtPos.left + 'px', top: tgtPos.top + 'px'},
            'fast','swing', function() {
            tgt.replaceWith(src)
            src.attr('id', id)
            next()
          })
        return

      case 'doSomething':
        getLoc(ev.loc).animate({top: '-=2px'},'fast')
                      .animate({top: '+=4px'},'fast')
                      .animate({top: '-=2px'},'fast',next)
        return

      case 'power':
        console.log(ev)
        setTimeout(next,0)
        return

      default:
        console.log('unknown event', ev)
        setTimeout(next,0)
        return
    }

  }

  drawEvent(0)
}
