var selected = null
var gameID = null
var helpMode = false
var oldGame = null
var errMsg = null

function makeTurn(url,info,tgt) {
  var newG = null
  var animFinished = false

  function draw() {
    drawEvents(newG.log, function() {
      $('body').empty().append(drawNewGame(),drawGame(newG.game))
    })
  }

  if (tgt !== undefined) {
    finished = false
    var loc = $(tgt).offset()
    selected.dom
      .css('position','absolute')
      .css('z-index','100')
      .animate({ left: loc.left, top: loc.top }, 'slow', 'swing', function() {
         selected.dom.hide()
         if (newG !== null) draw()
         else animFinished = true
      })
  } else animFinished = true

  jQuery.extend(info, { gid: gameID })
  jQuery.post(url, info, function(res) {
    errMsg = null
    oldGame = res
    newG = res
    if (animFinished) draw()
  }).fail(function(err) {
    console.log(err.statusText)
    errMsg = err.statusText
    newG = oldGame
    draw()
  });


}

function setSource(x,row,ix,cd) {
  var card = cd.card

  return function() {
    if (helpMode) {
      $('#helpBox').empty()
        .append( $('<h4/>').text(card.name)
               , $('<p>').text(card.description)
               )
      return
    }

    if (!cd.enabled) return

    if (cd.target === 'none') {
      makeTurn('/playCard', { element: row.toLowerCase(), card: ix })
      return
    }

    if (selected !== null) {
      selected.dom.removeClass('selected')
    }
    selected = { dom: x, row: row, ix: ix, card: cd}
    x.addClass('selected')
  }
}

function setTarget(card,who,i) {
  return function(ev) {
    if (selected === null) return
    var matched = false;
    switch(selected.card.target) {

      case 'opponent_creature':
        matched = card !== null && who === 'opponent'
        break

      case 'opponent_normal_creature':
        matched = card !== null && who === 'opponent'
                  && card.element !== 'Special'
        break

      case 'catser_creature':
        matched = card !== null && who === 'caster'
        break

      case 'catser_blank':
        matched = card === null && who === 'caster'
        break

      case 'any_creature':
        matched = card !== null
        break
    }
    if (matched) {
      makeTurn( '/playTargetedCard'
              , { element: selected.row.toLowerCase()
               , card: selected.ix, loc: i, who: who }
              , this
              )
      return
    }
  }
}



function img(x) {
  return $('<img/>')
         .attr('src','img/' + x)
         .css('position','absolute')
         .css('left', '0')
         .css('top', '0')
         .css('width', '96px')
         .css('height','96px')
}

function stat(x,t,l,c) {
  return $('<div/>')
         .css('position','absolute')
         .css('color',c)
         .css('font-size','10px')
         .css('font-weight','bold')
         .css('top',t + 'px')
         .css('left', l + 'px')
         .css('z-index','4')
         .css('width','10px')
         .css('height','16px')
         .css('text-align','center')
         .text(x == null ? '?' : x)

}

function drawCardWithExplanation(c) {
  return $('<table/>')
         .append( $('<tr/>')
                  .append($('<td/>').attr('colspan','2').text(c.name))
                , $('<tr/>')
                 .append($('<td/>').append(drawCard(c))
                        ,$('<td/>').text(c.description)))
}

function drawCard(c) {

  var grp = $('<div/>')
            .css('position','relative')
            .css('overflow','hidden')
            .css('display','inline-block')
            .css('width', '96px')
            .css('height','96px')

  if (c == null) {
    // grp.css('border','1px solid #666')
    grp.css('background-color','rgba(0,0,0,0.5)')
       .css('border-radius','5px')
    return grp
  }

  grp.attr('title', c.name + '\n' + c.description)
  if (c.type == 'spell') {
    grp.append(img(c.image)
               .css('height','112')
               .css('top','-16px')
              )
    grp.append(img('ramka2.png')
              .css('z-index','2'))
    grp.append(stat(c.cost,4,80,'black'))

  } else {
    grp.append(img(c.image))
    grp.append(img('ramka1.png')
              .css('z-index','2'))
    grp.append(stat(c.cost,7,76,'black'))
    grp.append(stat(c.life,77,75,'green'))
    grp.append(stat(c.attack,76,10,'red'))
  }

  return grp
}

function drawDeckCard(c,owner) {
  if (c === null) return drawCard(null)

  var dom = drawCard(c.card).addClass(owner)
  if (!c.enabled) dom.addClass('disabled')
  return dom
}

function drawDeckRow(p,row,who) {
  var dom = $('<tr/>')
  var pow = $('<td/>')
            .attr('id',who + '_' + row)
            .text(row + ': ' + p.power[row])
  dom.append(pow)
  jQuery.each(p.deck[row], function(ix,card) {
    var x = drawDeckCard(card,who)
            .addClass('deck')
    // if (card.enabled) x.click(setSource(x,row,ix,card))
    x.click(setSource(x,row,ix,card))
    dom.append($('<td/>').append(x))
  })
  return dom
}

function drawPlayer(p,r) {
  var dom = $('<div/>')
            .attr('id',r)
            .css('background-color','rgba(0,0,0,0.5)')
            .css('color','white')
            .css('display','inline-block')
            .css('margin', '20px')
            .css('border-radius','10px')

  var pref = r === 'caster' ? '> ' : ''

  var name = $('<h3/>')
             .css('text-align','center')
             .text(pref + p.name + ' (' + p.life + ')')
  dom.append(name)

  var deckTable = $('<table/>')
  jQuery.each(["Fire","Water","Air","Earth","Special"], function(ix,w) {
    deckTable.append(drawDeckRow(p,w,r))
  })

  dom.append(deckTable)

  return dom
}

function drawArenaField(act,r,i,al) {
  return drawDeckCard(act,r).attr('id', r + '_' + i)
                            .addClass(al)
                            .click(setTarget(act, r, i))
}

function drawArena(p1,p2,r1,r2) {
  var dom = $('<table/>').css('display','inline-block')
                         .css('valign','bottom')
                         .css('background-color','rgba(0,0,0,0.5)')
  var act1 = p1.active
  var act2 = p2.active
  jQuery.each([0,1,2,3,4,5], function(i,num) {
    var row = $('<tr/>')
    var actL = act1[i]
    var actR = act2[i]
    var x = drawArenaField(actL,r1,i, 'arena_left')
    var y = drawArenaField(actR,r2,i, 'arena_right')
    row.append($('<td/>').append(x),$('<td/>').append(y))
    dom.append(row)
  })
  return dom
}

function drawGame(g) {
  var left = g.current
  var right = g.other
  var leftR = 'caster'
  var rightR = 'opponent'
  if (left.name.localeCompare(right.name) > 0) {
    left = g.other
    right = g.current
    leftR = 'opponent'
    rightR = 'caster'
  }

  return $('<table/>')
         .append($('<tr/>')
                .append( $('<td/>').append(drawPlayer(left,leftR))
                       , $('<td/>').append(drawArena(left,right,leftR,rightR))
                       , $('<td/>').append(drawPlayer(right, rightR))
                       ))
}


function fancyBtn(txt) {
  return $('<div/>')
         .css('display','inline-block')
         .css('margin', '5px')
         .css('padding','3px')
         .css('color','black')
         .css('background-color','orange')
         .css('border', '1px solid #fc3')
         .css('border-radius', '5px')
         .css('box-shadow', '0px 0px 20px #999')
         .css('cursor','pointer')
         .text(txt)
}


