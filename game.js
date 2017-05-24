var rows = Math.floor((window.screen.availHeight-230)/25);
var cols= Math.floor((window.screen.availWidth-5)/25);
var numberOfMines=75;
var cellCounter = numberOfMines;
var flagCounter = numberOfMines;
var mineList=[];
var bombSound = new Audio('https://noahshogan.000webhostapp.com/minesweeper/sounds/bomb.mp3');
var clickSound = new Audio('https://noahshogan.000webhostapp.com/minesweeper/sounds/click.mp3');
var gameOn = true;
keysDown = {};


addEventListener("keydown", function (e) {
    keysDown[e.keyCode] = true;
}, false);
addEventListener("keyup", function (e) {
    keysDown[e.keyCode] = false;
}, false);

var myApp = angular.module('sweeper',[]);
myApp.controller('Minesweeper', ['$scope', function($scope) {
//function Minesweeper($scope) {
    $scope.minefield = createMinefield(rows,cols,numberOfMines);
    $scope.myFlagCounter = flagCounter;
    /**
     * handle clicking on square
     * @param {obj} _square -specific square from the minefield.
     */
    $scope.clickOnSquare=function(_square){
        //if the game is not over or the square is not flaged do nothing
        if(!gameOn||$scope.minefield[_square.i][_square.j].flag||(keysDown[16])){
            return;
        }
        clickSound.pause();
        clickSound.currentTime = 0;
        clickSound.play();
        //if the content of the given square is bomb - then the game is over
        if($scope.minefield[_square.i][_square.j].content=="bomb"){
            bombSound.play();
            //go trough all the 2d array
            for (var i = 0; i < rows; i++) {
                for (var j = 0; j < cols; j++) {
                    //and discover all the bombs
                    if($scope.minefield[i][j].content=="bomb"){
                        $scope.minefield[i][j].isClicked=true;
                    }
                }
            }
            //mark the pressed square so i can paint its background with red color
            $scope.minefield[_square.i][_square.j].bomb=true;
            //alert to the user that the game is over
            setTimeout(function(){
                gameOn=false;
                window.alert("gameOver");
            }, 100);
        }
        //if the square is counting bombs e.g not with bomb and not "empty"
        else if(!($scope.minefield[_square.i][_square.j].content=="bomb")&&!($scope.minefield[_square.i][_square.j].content==0)){
            //discover it
            $scope.minefield[_square.i][_square.j].isClicked=true;
        }
        else{//if we are here then that means the square is empty
            // we call a function to clear the area around the square
            clearAllNeighbors(_square);
        }
        //check if the number of undiscovered squares is matching to the number of mines
        if (cellCounter ==countVisibles()){
            setTimeout(function(){
                window.alert("good job");
                gameOn=false;
            }, 100);
        }
        $scope.myFlagCounter=flagCounter;
    }
    /**
     * returns the content of the square for the "track by" option in angular
     * @param {obj} _square -specific square from the minefield.
     */
    $scope.id=function(_square){{
            return _square.content;
        }
    }
    /**
     * handel cases when the user want to put a flag on the feald so he uses 2 inputs "shift+click"
     * @param {mousePressEvent} evt - code of pressed key.
     * @param {obj} _square -specific square from the minefield.
     */
    $scope.handleClick = function(evt,_square) {
        //if game is on
        if(gameOn){
            //and the user presses the "shift" key + the right mouse click
            if((keysDown[16]&&evt.which==1)) {
                //if the square is flagged
                if($scope.minefield[_square.i][_square.j].flag==true){
                    //then remove the flag
                        $scope.minefield[_square.i][_square.j].flag=false;
                    flagCounter++;
                    //update the flag counter on the HTML page
                    $scope.myFlagCounter=flagCounter;
                    return;
                }else if (flagCounter==0){window.alert("No more flags left");}
                else{//the square is not flagged
                    //the flag counter in the HTML file is bigger the 0 e.g the player can use more flags
                    if($scope.myFlagCounter>0){
                        //put a flag on the square
                        $scope.minefield[_square.i][_square.j].flag=true;
                        flagCounter--;
                        //update the flag counter on the HTML page
                        $scope.myFlagCounter=flagCounter;
                        //if the player used all his flags
                        if(flagCounter==0){
                            //compare all the bomb positions to the flag position to see if they are equal.
                            var tmpmineList = mineList.slice();
                            var tmpCounter = cellCounter;
                            for(var i = 0;i<cellCounter;i++){
                                var tmpSquare = tmpmineList.pop();
                                if(tmpSquare.flag){
                                    tmpCounter--;
                                }
                            }
                            if(tmpCounter==0){
                                setTimeout(function(){
                                    window.alert("good job");
                                    gameOn=false;
                                }, 100);
                            }
                        }
                    }else{return;}//if the user pressed anything else them "shft+rightMouseClick"
                }
            }
        }
        /*if(evt.which==1) {
            if(gameOn){

            }
        }*/
    };
    /**
     * once a square is pushed the function reveal all cells around it and and all cells around any adjacent empty cell
     * we use a simple bfs to find all the empty squares group around the pushed square
     * @param {obj} _square -specific square from the minefield.
     */
    function clearAllNeighbors(_square){
        //init list of Neighbors that contains the pushed square
        var listOfNeighbors = [_square];
        //mark the square as visited
        $scope.minefield[_square.i][_square.j].visited=true;
        //init list for the squares thea are not empty e.g are numeric(the ring around the empty squares group)
        var listOfNeighborsRing = [_square];
        //use function to add add the nearest Neighbors of the square
        listOfNeighbors=addToListAllLeagalNeighbors(listOfNeighbors,_square);
        //while there are mor squares in the list...
        while(listOfNeighbors.length>0){
            //get the first square from the list
            var tmpSquare = listOfNeighbors.pop();
            //discover it on the HTML and mark it as visited
            $scope.minefield[tmpSquare.i][tmpSquare.j].visited=true;
            $scope.minefield[tmpSquare.i][tmpSquare.j].isClicked=true;
            //if the square was with flag on it remove it
            if ($scope.minefield[tmpSquare.i][tmpSquare.j].flag){
                flagCounter++;
            }
            //use function to add add the nearest Neighbors of the square
            listOfNeighbors=addToListAllLeagalNeighbors(listOfNeighbors,tmpSquare);
            listOfNeighborsRing = addToListRingAllLeagalNeighbors(listOfNeighborsRing,tmpSquare);
        }
        //at the same way discover the square of the "ring"
        while(listOfNeighborsRing .length>0){
            var tmpSquare = listOfNeighborsRing .pop();
            $scope.minefield[tmpSquare.i][tmpSquare.j].isClicked=true;
            if ($scope.minefield[tmpSquare.i][tmpSquare.j].flag){
                flagCounter++;
            }
        }
    }
    /**
     * creating new game - generate new minefield
     * @param {int} $scope.rowsInput - number of rows.
     * @param {int} $scope.colsInput - number of columns.
     * @param {int} $scope.numberOfMinesInput - number of mines.
     */
    $scope.newGame = function(){
        //use function to check if al the input is valid
        var valid = validateInputs($scope.rowsInput,$scope.colsInput,$scope.numberOfMinesInput);
        if(valid){
            //reset all the variables
            rows=$scope.rowsInput;
            cols=$scope.colsInput;
            numberOfMines=$scope.numberOfMinesInput;
            flagCounter = numberOfMines;
            cellCounter = numberOfMines;
            mineList=[];
            gameOn = true;
            $('#myModal').modal('hide');
            //create new minefield
            $scope.minefield = createMinefield(rows,cols,numberOfMines);
            $scope.myFlagCounter = flagCounter;
        }
    }
    /**
     * validate the variablss needed for game initialize.
     * @param {int} _row - number of rows.
     * @param {int} _col - number of columns.
     * @param {int} _mine - number of mines.
     */
    function validateInputs(_row,_col,_mine){
        //we can see the "output" for every test
        var ans=true;
        var str = "";
        var NaN = "";
        if(!parseInt(_row)){
            NaN+="Number of rows must be a number \n";
        }
        if(!parseInt(_col)){
            NaN+="Number of columns must be a number \n";
        }
        if(!parseInt(_mine)){
            NaN+="Number of mines must be a number \n";
        }
        if(!parseInt(_row)||!parseInt(_col)||!parseInt(_mine)){
            window.alert(NaN);
            return false;
        }
        if(_row<4){
            ans=false;
            str+="Number Of rows must be greater then 4 \n"
        }
        if(_row>300){
            ans=false;
            str+="Number Of rows must be smaller then 18 \n"
        }
        if(_col<4){
            ans=false;
            str+="Number Of columns must be greater then 4 \n"
        }
        if(_col>300){
            ans=false;
            str+="Number Of columns must be smaller then 40 \n"
        }
        if(_mine>_col*_row*0.6){
            ans=false;
            str+="Number mines is too big!\n"
        }
        if(_mine<1){
            ans=false;
            str+="Number mines mist be bigger them 1!\n"
        }

        if(!ans){
            window.alert(str);
        }
        return ans;
    }
    /**
     * the function checks the top,right,bottom,left squares if they are inside of the board  and if they are not visited.
     * @param {List} listOfNeighborsRing - list of squares that contains the empty squares to be revealed.
     * @param {obj} _square - specific square from the minefield.
     */
    function addToListRingAllLeagalNeighbors(listOfNeighborsRing, _square) {
        if(_square.i-1>=0){
            if ($scope.minefield[_square.i-1][_square.j].content!="bomb"&&$scope.minefield[_square.i-1][_square.j].visited==false){
                listOfNeighborsRing.push($scope.minefield[_square.i-1][_square.j])
            }
        }
        if(_square.j-1>=0){
            if ($scope.minefield[_square.i][_square.j-1].content!="bomb"&&$scope.minefield[_square.i][_square.j-1].visited==false){
                listOfNeighborsRing.push($scope.minefield[_square.i][_square.j-1])
            }
        }
        if(_square.i+1<rows){
            if ($scope.minefield[_square.i+1][_square.j].content!="bomb"&&$scope.minefield[_square.i+1][_square.j].visited==false) {
                listOfNeighborsRing.push($scope.minefield[_square.i + 1][_square.j])
            }
        }
        if(_square.j+1<cols){
            if ($scope.minefield[_square.i][_square.j+1].content!="bomb"&&$scope.minefield[_square.i][_square.j+1].visited==false) {
                listOfNeighborsRing.push($scope.minefield[_square.i][_square.j + 1])
            }
        }
        return listOfNeighborsRing;
    }
    /**
     * the function checks the top,right,bottom,left squares if they are inside of the board  and if they are not visited.
     * @param {List} listOfNeighbors - list of squares that contains the empty squares to be revealed.
     * @param {obj} _square - specific square from the minefield.
     */
    function addToListAllLeagalNeighbors(listOfNeighbors, _square) {
        if(_square.i-1>=0){
            if ($scope.minefield[_square.i-1][_square.j].content==0&&($scope.minefield[_square.i-1][_square.j].isClicked==false&&$scope.minefield[_square.i-1][_square.j].visited!=true)){
                listOfNeighbors.push($scope.minefield[_square.i-1][_square.j])
                $scope.minefield[_square.i-1][_square.j].visited=true;
            }
        }
        if(_square.j-1>=0){
            if ($scope.minefield[_square.i][_square.j-1].content==0&&($scope.minefield[_square.i][_square.j-1].isClicked==false&&$scope.minefield[_square.i][_square.j-1].visited!=true)){
                listOfNeighbors.push($scope.minefield[_square.i][_square.j-1])
                $scope.minefield[_square.i][_square.j-1].visited=true;
            }
        }
        if(_square.i+1<rows){
            if ($scope.minefield[_square.i+1][_square.j].content==0&&($scope.minefield[_square.i+1][_square.j].isClicked==false&&$scope.minefield[_square.i+1][_square.j].visited!=true)) {
                listOfNeighbors.push($scope.minefield[_square.i + 1][_square.j])
                $scope.minefield[_square.i+1][_square.j].visited=true;
            }
        }
        if(_square.j+1<cols){
            if ($scope.minefield[_square.i][_square.j+1].content==0&&($scope.minefield[_square.i][_square.j+1].isClicked==false&&$scope.minefield[_square.i][_square.j+1].visited!=true)) {
                listOfNeighbors.push($scope.minefield[_square.i][_square.j + 1])
                $scope.minefield[_square.i][_square.j+1].visited=true;
            }
        }
        return listOfNeighbors;
    }
    /**
     * counts the remaining squares that not discovered yet
     */
    function countVisibles(){
        var counter=0;
        for (var i = 0; i < rows; i++) {
            for (var j = 0; j < cols; j++) {
                if (!($scope.minefield[i][j].isClicked)){
                    counter++;
                }
            }
        }
        return counter;
    }
}]);

/**
 * initialize the 2d array and fill every square with its relevant data.
 * @param {int} _i- number of rows.
 * @param {int} _j - number of columns.
 */
function createMinefield(_i,_j) {
    //initialize array of rows
    var minefield = new Array(_i);
    for(var i = 0; i < _i; i++) {
        //for every row initialize new array of columns
        minefield[i]=new Array(_j);
        for(var j = 0; j < _j; j++) {
            //set all squares with starting data.
            minefield[i][j]={isClicked : false,visited : false,content : 0,flag:false,i:i,j:j};
        }
    }
    //loop to place mines on the field
    while(numberOfMines-->0){
        placeRandomMine(minefield);
    }
    //function that sets the number of mines around every cell
    setSquareNumericValues(minefield,mineList);

    for(var i = 0; i < _i; i++) {
        for(var j = 0; j < _j; j++) {
             if(minefield[i][j].content==0)
                 minefield[i][j].content='';
        }
    }

    $('#myModal').modal('hide');
    return minefield;
}
/**
 * detect an empty random square and set it as a mine.
 * @param {Array} minefield - 2d array of squares - the minefield.
 */
function placeRandomMine(minefield) {
    //randomize numbers for row and column
    var row = Math.round(Math.random() * (rows-1));
    var column = Math.round(Math.random() * (cols-1));
    //while the square we choose is "taken" by a mine get new random square
    while(minefield[row][column].content=="bomb"){
        row = Math.round(Math.random() * (rows-1));
        column = Math.round(Math.random() * (cols-1));
    }
    //set the mine on the randomly selected empty square
    minefield[row][column].content="bomb";
    mineList.push(minefield[row][column])
}
/**
* function that sets the number of mines around every cell
 * @param {Array} minefield - 2d array of squares - the minefield.
 * @param {Array} mineList - list of the mines.
*/
function setSquareNumericValues(minefield,mineList) {
    //for every mine in the list increase the counter of all surrounding squares by one.
    for(var ii=0;ii< mineList.length;ii++){
        var counter = 0;
        if(mineList[ii].i-1>=0&&mineList[ii].j-1>=0){
            if (minefield[mineList[ii].i-1][mineList[ii].j-1].content!="bomb"){
                minefield[mineList[ii].i-1][mineList[ii].j-1].content++;
            }
        }
        if(mineList[ii].i-1>=0){
            if (minefield[mineList[ii].i-1][mineList[ii].j].content!="bomb"){
                minefield[mineList[ii].i-1][mineList[ii].j].content++;
            }
        }
        if(mineList[ii].j-1>=0){
            if (minefield[mineList[ii].i][mineList[ii].j-1].content!="bomb"){
                minefield[mineList[ii].i][mineList[ii].j-1].content++;
            }
        }
        if(mineList[ii].i+1<rows&&mineList[ii].j+1<cols){
            if (minefield[mineList[ii].i+1][mineList[ii].j+1].content!="bomb") {
                minefield[mineList[ii].i+1][mineList[ii].j+1].content++;
            }
        }
        if(mineList[ii].i+1<rows){
            if (minefield[mineList[ii].i+1][mineList[ii].j].content!="bomb") {
                minefield[mineList[ii].i+1][mineList[ii].j].content++;
            }
        }
        if(mineList[ii].j+1<cols){
            if (minefield[mineList[ii].i][mineList[ii].j+1].content!="bomb") {
                minefield[mineList[ii].i][mineList[ii].j+1].content++;
            }
        }
        if(mineList[ii].i+1<rows&&mineList[ii].j-1>=0){
            if (minefield[mineList[ii].i+1][mineList[ii].j-1].content!="bomb"){
                minefield[mineList[ii].i+1][mineList[ii].j-1].content++;
            }
        }
        if(mineList[ii].i-1>=0&&mineList[ii].j+1<cols){
            if (minefield[mineList[ii].i-1][mineList[ii].j+1].content!="bomb"){
                minefield[mineList[ii].i-1][mineList[ii].j+1].content++;
            }
        }
    }
}

