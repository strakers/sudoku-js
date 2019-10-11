function sudokuBuilder( opts ){

    opts = opts || {};

    // create global object
    var sudoku = window.sudoku = {}, // not done yet...

    // create default property container
    defaults = {};
    defaults.quadrants = opts.quadrants || 9;
    defaults.resetText = opts.resetText || "Clear Board";
    defaults.newGameText = opts.newGameText || "New Game";
    defaults.completeMessage = opts.completeMessage || "Congratulations! You have completed the board!";
    defaults.toggleErrorText = opts.toggleErrorText || ["Hide Errors","Show Errors"];
    defaults.defaultLevel = opts.level || "easy";
    defaults.showErrors = opts.showErrors || false;

    /* --------------------------------------------------------------------------- */

    // create initial variables
    var inputs = '', limit = defaults.quadrants + 1,
        qx = 0.5, qy = 0.5, qz = 0, q = 0; /*

			i : calculates the row grouping
			j : calculates the column grouping
			q = qx + qy + qz : calculate the quandrant (or large square) grouping. q is always an integer

		*/

    // assign sudoku board element
    sudoku.board = document.getElementById('sudoku');

    // create sudoku cells : quadrant algorythm = ((x + 0.5) + (y + 0.5) + z), where x, y, and z are integers.
    for(var i=1,j=1;i<limit;++i){
        qx = 0.5 + qz;
        for(j=1;j<limit;++j){
            q = qx + qy;
            inputs += '<input type="number" class="cell c'+j+' r'+i+' q'+q+'" data-column="'+j+'" data-row="'+i+'" data-quad="'+q+'" onchange="sudoku.cellChange(this)" min="1" max="9" maxlength="1" />';
            if(j % 3 === 0) qx++;
        }
        if(i % 3 === 0){ qy++; qz+=2; }
    }

    // add sudoku cells to DOM via innerHTML - converts HTML written as a String into actual HTMLElement objects
    sudoku.board.innerHTML = inputs;

    // reassign variable from String type to NodeList (object) type - a NodeList is a list of HTMLElement object nodes
    // this is essentially reusing the variable, rather than creating a new one, since the string reference is no longer needed
    inputs = sudoku.board.getElementsByClassName('cell');

    // get sudoku bounds and group counts
    sudoku.columns = j - 1;
    sudoku.rows = i - 1;
    sudoku.quadrants = q;

    // resize sudoku board to fit cells - 3/26 ratio is not yet scalable. to make scalable, need more dimensions for ratio
    sudoku.board.style.width = Math.floor(inputs[0].clientWidth * inputs.length * 3/24) + "px";

    // create alias function to return cell row/column/quadrant groupings
    sudoku.board.getGroup = function( className ){ return sudoku.board.getElementsByClassName(className); };

    // create button grouping
    sudoku.btnGrouper = document.createElement('div');
    sudoku.btnGrouper.className = "btn-group";
    sudoku.board.appendChild(sudoku.btnGrouper);

    // create button to show/suppress error notifications. v1.2 addition
    sudoku.errorToggler = document.createElement('button');
    sudoku.errorToggler.onclick = function(e){ e.preventDefault(); sudoku.toggleErrorAlerting(); };
    sudoku.errorToggler.className = "action toggleerror btn btn-warning";
    sudoku.errorToggler.innerHTML = defaults.toggleErrorText[0];
    sudoku.btnGrouper.appendChild(sudoku.errorToggler);

    // create new game button
    sudoku.startOver = document.createElement('button');
    sudoku.startOver.onclick = function(e){ e.preventDefault(); sudoku.newGame(defaults.defaultLevel); };
    sudoku.startOver.className = "action startnew btn btn-primary";
    sudoku.startOver.innerHTML = defaults.newGameText;
    sudoku.btnGrouper.appendChild(sudoku.startOver);

    // create reset button
    sudoku.reset = document.createElement('button');
    sudoku.reset.onclick = function(e){ e.preventDefault(); sudoku.clear(); };
    sudoku.reset.className = "action reset btn btn-warning";
    sudoku.reset.innerHTML = defaults.resetText;
    sudoku.btnGrouper.appendChild(sudoku.reset);

    /* --------------------------------------------------------------------------- */

    // show or supress errors, for players who don't want to "cheat". v1.2 adition
    sudoku.toggleErrorAlerting = function(){
        if(~sudoku.board.className.search('noerrors')){
            sudoku.board.className = sudoku.board.className.replace( /(?:^|\s)noerrors(?!\S)/g , '' );
            sudoku.errorToggler.innerHTML = defaults.toggleErrorText[0];
        } else {
            sudoku.board.className += 'noerrors';
            sudoku.errorToggler.innerHTML = defaults.toggleErrorText[1];
        }
    };

    // sudoku cell onchange callback function - performs error & completion checking on cell groupings
    sudoku.cellChange = function( el ){
        if( el && el['DOCUMENT_NODE'] ){ // quickly checks DOCUMENT_NODE property to see if variable is an HTMLElement
            let col = 'c'+el.getAttribute('data-column'),
                row = 'r'+el.getAttribute('data-row'),
                quad = 'q'+el.getAttribute('data-quad');
            sudoku.checkError( row );
            sudoku.checkError( col );
            sudoku.checkError( quad );
            sudoku.checkComplete();
        }
    };

    // checks the board for completion - notifies user if complete
    sudoku.checkComplete = function(){
        let group = sudoku.board.getElementsByClassName('cell'),
            errors = {
                row: sudoku.board.getElementsByClassName('errorRow'),
                col: sudoku.board.getElementsByClassName('errorCol'),
                quad: sudoku.board.getElementsByClassName('errorQual')
            },
            el = group.length, entries = 0;

        if( !errors.row.length && !errors.col.length && !errors.quad.length && group.length === sudoku.rows * sudoku.columns ){
            while(el--){
                if(group[el].value && group[el].value !== ' ' && group[el].value*1>0) entries++;
            }
            if( entries === sudoku.rows * sudoku.columns ){
                alert( defaults.completeMessage );
                sudoku.board.className += ' complete';
            }
        }
    };

    // checks a specific group for errors - notifies user if error, or clears notification depending on findings
    sudoku.checkError = function( className ){
        let group = sudoku.board.getElementsByClassName(className), sequence = {}, errorFlag = false;
        for(let i = 0, v = 0;i<group.length;++i){
            v = group[i].value;
            if(v){
                if(sequence[v]){ errorFlag = true; break; }
                else if(v*1>0) sequence[v] = true;
                else { errorFlag = true; break; }
            }
        }
        if(errorFlag) sudoku.errorAlert( className );
        else sudoku.removeError( className );
    };

    // notifies the user of an error in a cell grouping
    sudoku.errorAlert = function( groupName ){
        let type = typeof groupName === 'string' ? groupName.substr(0,1) : null, errorClass = ' error', group = sudoku.board.getElementsByClassName( groupName ), el = group.length;
        switch(type){ case 'r': errorClass += 'Row'; break; case 'c': errorClass += 'Col'; break; case 'q': errorClass += 'Quad'; break; default: errorClass = ''; break; }
        while(el--){ if(!~group[el].className.indexOf(errorClass)) group[el].className += errorClass; }
    };

    // removes error notification for a cell grouping
    sudoku.removeError = function( groupName ){
        let type = typeof groupName === 'string' ? groupName.substr(0,1) : null, regex, group = sudoku.board.getElementsByClassName( groupName ), el = group.length;
        switch(type){ case 'r': regex = /(?:^|\s)errorRow(?!\S)/g; break; case 'c': regex = /(?:^|\s)errorCol(?!\S)/g; break; case 'q': regex = /(?:^|\s)errorQuad(?!\S)/g; break; }
        while(el--){ group[el].className = group[el].className.replace( regex , '' ) }
    };

    // optional function for creating an easily completed sudoku puzzle
    sudoku.autoFill = function(){
        let fill = 	('123456789'+'456789123'+'789123456'+
            '234567891'+'567891234'+'891234567'+
            '345678912'+'678912345'+'91234567 ').split(''),
            group = sudoku.board.getElementsByClassName('cell'),
            i = group.length;
        while(i--){ group[i].value = fill[i]; }
    };

    // clears the sudoku board of inputted numbers. retains generated numbers,
    sudoku.clear = function(){
        let group = sudoku.board.getElementsByClassName('cell'),
            i = group.length;
        while(i--){
            if(!group[i].disabled) group[i].value = null;
            group[i].className = group[i].className.replace(/(?:^|\s)errorRow(?!\S)|(?:^|\s)errorCol(?!\S)|(?:^|\s)errorQuad(?!\S)/g,''); // v1.2 fix to remove errors from cleared cells
        }
    };

    sudoku.gamesList = {'__loaded':false};

    // clears the sudoku board and generates a new puzzle
    // currently only provides "easy" level puzzles (but they are not so easy!)
    sudoku.newGame = function( difficultyLevel ){

        // if already loaded
        if(sudoku.gamesList['__loaded'] && sudoku.gamesList.__loaded){
            let map; if(map = sudoku.__getRandomGame( difficultyLevel )){
                sudoku.__populateSheet(map);
            }
            return true;
        }

        // retrieve games from server
        let xhr = new XMLHttpRequest();
        xhr.onload = function () {
            if (xhr.status >= 200 && xhr.status < 300) {
                if( xhr.response ){
                    try {
                        sudoku.gamesList = JSON.parse(xhr.response);
                        sudoku.gamesList.__loaded = true;
                    }
                    catch(e){
                        console.log('error! unable to parse', xhr.response);
                        return false;
                    }

                    // load game
                    let map; if(map = sudoku.__getRandomGame( difficultyLevel )){
                        sudoku.__populateSheet(map);
                    }
                }
            } else {
                return false;
            }
        };
        xhr.open('GET', 'assets/games.json');
        xhr.send();
    };

    // selects at random a game of a particular difficulty level
    sudoku.__getRandomGame = function( difficultyLevel ){
        let game_map = null;

        // validates difficultyLevel as a String
        if(typeof difficultyLevel === 'string'){

            // retrieves a random puzzle string from the lists
            game_map = sudoku.gamesList[difficultyLevel][Math.floor(Math.random() * sudoku.gamesList[difficultyLevel].length)];

            // filters puzzle string and prepares output for the board
            if(game_map) {
                game_map = game_map.replace(/0/g,' ').split('');
            }
        }

        return game_map;
    };

    // outputs mapped game to the board
    sudoku.__populateSheet = function( map ){
        let group = sudoku.board.getElementsByClassName('cell'),
            i = group.length;

        while(i--){
            if(map[i]!==' '){
                group[i].value = map[i];
                group[i].disabled = true;
            }
            else {
                group[i].value = null; group[i].disabled = false;
            }
        }
    };

    // automatically invokes a new game
    sudoku.newGame( defaults.defaultLevel );

    // if suppress errors
    if(!defaults.showErrors) sudoku.toggleErrorAlerting();

    return sudoku;

}