game = new Chess();
var socket = io();

var color = "white";
var players;
var roomId;
var play = true;

var room = document.getElementById("room")
var roomNumber = document.getElementById("roomNumbers")
var button = document.getElementById("button")
var state = document.getElementById('state')

var connect = function(){
    roomId = room.value;
    if (roomId !== "" && parseInt(roomId) <= 100) {
        room.remove();
        roomNumber.innerHTML = "Room Number " + roomId;
        button.remove();
        document.getElementById('buttonContainer').style.display = 'none';
        $('#board').addClass('space-after');
        socket.emit('joined', roomId);
    }
    initialBoard.destroy;
}
socket.on('full', function (msg) {
    if(roomId == msg)
        window.location.assign(window.location.href+ 'full.html');
});

socket.on('play', function (msg) {
    if (msg == roomId) {
        play = false;
        state.innerHTML = "Game in progress";
    }
    // console.log(msg)
});

socket.on('move', function (msg) {
    if (msg.room == roomId) {
        var move = board.move(msg.from+'-'+msg.to);
        game.load(board.fen() + ' ' + color.charAt(0) + ' - - 0 1');
        console.log("moved");
        if(!kingExists(color)){
            state.innerHTML = "GAME OVER";
        }
    }
});
socket.on('gameOver', function() {
    state.innerHTML = 'GAME OVER';
    game.clear()
});


var removeGreySquares = function () {
    $('#board .square-55d63').css('background', '');
};

var greySquare = function (square) {
    var squareEl = $('#board .square-' + square);

    var background = '#a9a9a9';
    if (squareEl.hasClass('black-3c85d') === true) {
        background = '#696969';
    }

    squareEl.css('background', background);
};

var onDragStart = function (source, piece) {
    // do not pick up pieces if the game is over
    // or if it's not that side's turn
    if (!kingExists(color) === true || play ||
        (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1) ||
        (game.turn() === 'w' && color === 'black') ||
        (game.turn() === 'b' && color === 'white') ) {
            return false;
    }
    // console.log({play, players});
};

var onDrop = function (source, target) {
    removeGreySquares();

    // see if the move is legal
    var move = game.move({
        from: source,
        to: target,
        promotion: 'q' // NOTE: always promote to a queen for example simplicity
    });
    
    if (!kingExists(color)) {
        state.innerHTML = 'GAME OVER';
        socket.emit('gameOver', roomId)
        game.clear()
    }
    
    // illegal move
    if (move === null) return 'snapback';
    else
        socket.emit('move', { from: source, to: target, room: roomId }); // Updated line
};


var onMouseoverSquare = function (square, piece) {
    // get list of possible moves for this square
    var moves = game.moves({
        square: square,
        verbose: true
    });

    // exit if there are no moves available for this square
    if (moves.length === 0) return;

    // highlight the square they moused over
    greySquare(square);

    // highlight the possible squares for this piece
    for (var i = 0; i < moves.length; i++) {
        greySquare(moves[i].to);
    }
};

var onMouseoutSquare = function (square, piece) {
    removeGreySquares();
};

var onSnapEnd = function () {
    board.position(game.fen());
};


socket.on('player', (msg) => {
    var plno = document.getElementById('player')
    color = msg.color;

    plno.innerHTML = 'Player ' + msg.players + " : " + color;
    players = msg.players;

    if(players == 2){
        play = false;
        socket.emit('play', msg.roomId);
        state.innerHTML = "Game in Progress"
    }
    else
        state.innerHTML = "Waiting for Second player";
    
    
    var initialFen;
    if (color == "white") {
        initialFen = initialBoard.fen().replace('8/8', 'pppppppp/pppppppp');
    } else {
        initialFen = initialBoard.fen().toLowerCase();
        initialFen = initialFen.split('').reverse().join('');
        initialFen = initialFen.replace('/8/8/8/8/8/8', '/8/8/8/8/PPPPPPPP/PPPPPPPP');
    }
        
    
    var cfg = {
        orientation: color,
        draggable: true,
        position: initialFen,
        onDragStart: onDragStart,
        onDrop: onDrop,
        onMouseoutSquare: onMouseoutSquare,
        onMouseoverSquare: onMouseoverSquare,
        onSnapEnd: onSnapEnd
    };
    initialBoard.destroy();
    board = ChessBoard('board', cfg);
    
    game.load(initialFen + ' w - - 0 1');
    
});
// console.log(color)

var board;


function checkInitialBoardFilled() {
    const pieces = initialBoard.position();
    let filledSquares = 0;

    for (const square in pieces) {
        const piece = pieces[square];
        if (piece && (square[1] === '1' || square[1] === '2')) {
            filledSquares++;
        }
    }

    const formContainer = document.getElementById('formContainer');
    if (filledSquares === 16) {
        formContainer.classList.remove('hidden');
        state.innerHTML = "Join game";
    } else {
        formContainer.classList.add('hidden');
        state.innerHTML = "Select the arrangment of your pieces below, use only white pieces (black pieces can be ingnored, as they don't do anything) and only in the first two rows. Also, use the same amount of each piece as you would use in a normal game (1 king, 1 queen, 2 rooks, 2 knights, 2 bishops, 8 pawns).";
    }
}

function countPieces() {
    const pieces = initialBoard.position();
    const pieceCounts = {};

    for (const square in pieces) {
        const piece = pieces[square];
        if (piece) {
            pieceCounts[piece] = (pieceCounts[piece] || 0) + 1;
        }
    }

    return pieceCounts;
}

function onDragStartInitialBoard(source, piece) {
    // Check if the piece limits are reached
    const pieceCounts = countPieces();
    const maxPieceCounts = {
        'wP': 8, 'bP': 8, // Pawns
        'wR': 2, 'bR': 2, // Rooks
        'wN': 2, 'bN': 2, // Knights
        'wB': 2, 'bB': 2, // Bishops
        'wQ': 1, 'bQ': 1, // Queens
        'wK': 1, 'bK': 1  // Kings
    };

    if (source === 'spare' && pieceCounts[piece] >= maxPieceCounts[piece]) {
        return false;
    }

    return true;
}

function onDropInitialBoard(source, target, piece) {
    // Check if the target square is occupied
    const currentPosition = initialBoard.position();
    if (currentPosition[target]) {
        //alert('Target square is occupied.');
        return 'snapback';
    }

    // Check if bishops are on the same color square
    if (piece[1] === 'B') {
        const squareColor = (target.charCodeAt(0) - 96 + parseInt(target[1])) % 2;
        for (const square in currentPosition) {
            if (currentPosition[square] === piece && (square.charCodeAt(0) - 96 + parseInt(square[1])) % 2 === squareColor) {
                alert('Two bishops cannot be on the same color square.');
                return 'snapback';
            }
        }
    }

    if ((piece.startsWith('w') && target[1] >= '3' && target[1] <= '8') || piece.startsWith('b')) {
        alert('Invalid target square for this piece.');
        return 'snapback';
    }

    setTimeout(() => {
        checkInitialBoardFilled();
    }, 0);
}



var initialCfg = {
    draggable: true, // Make the initial board draggable
    sparePieces: true,
    dropOffBoard: 'trash',
    onDrop: onDropInitialBoard,
    onDragStart: onDragStartInitialBoard
};
var initialBoard = ChessBoard('initialBoard', initialCfg);



function resetToStartingPosition() {
    const startingPositionFEN = '8/8/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    initialBoard.position(startingPositionFEN);
    checkInitialBoardFilled();
}

const resetBoardBtn = document.getElementById('resetBoardBtn');
resetBoardBtn.addEventListener('click', resetToStartingPosition);


function clearBoard() {
    initialBoard.clear();
    checkInitialBoardFilled();
}

document.getElementById('clearBoardBtn').addEventListener('click', clearBoard);

function kingExists(clr) {
    const position = board.position();
    const king = clr.charAt(0) === 'w' ? 'wK' : 'bK';

    for (const square in position) {
        if (position[square] === king) {
            return true;
        }
    }
    return false;
}
