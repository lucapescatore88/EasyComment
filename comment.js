
var app = angular.module("CommentsApp", []);
app.controller('CommentsCtrl', function($scope) {

    jQuery.ajaxSetup({async:false});

    // Initialise variables
    $scope.curcomm = null;
    $scope.hideoption = false;
    $scope.clinecomm = {"Prev":"","Cur":"","Next":"","PrevLine":"","NextLine":"","CurAuthor":""};
    $scope.erase_enabled = true;
    $scope.CommentType='Main';
    $scope.lastline = 1;

    // Parse url query parameters
    $scope.params = parseUrl();

    $scope.togglehide = function() {
        $scope.hideoption = $('#hideoptional').is(":checked");
    }

    $scope.parseLine = function(act){

        if (act===undefined) act = true;

        if ( $('#type').val() != "Main" && $('#type').val() != "References" ) 
            return {'l':null,'lend':null,'lstr':null}; 
        
        var l, lend;
        var lstr = $('#lines').val();
        if($('#type').val() == "References") lstr = $('#refs').val();

        lstr = cleanTabFigStr(lstr);
        if(lstr.indexOf("Tab") > -1 || lstr.indexOf("Fig") > -1 || lstr.indexOf("Eq") > -1 ) 
        {
            ll = lstr.indexOf("L");
            if (ll > -1)
            {
                l = Number(lstr.substring(ll+1));
                if(isNaN(l) && act) { alert("You must write 'L{number}', e.g. Tab. 4 L67, not 'Line' or else."); return; }
                if(act) $scope.lastline = l;
                lstr = lstr.substring(0,ll-1);
            }
            else if(act) l = $scope.lastline; 
            lend = -1; 
        }
        else 
        {
            lines = lstr.match( /\d*(\.(?=\d))?\d+/g );
            if ( lines===null ) { if(act) { alert("A 'Main' comment needs a line number specified!"); return;} }
            else if ( lines.length == 1 ) { l = Number(lines[0]); lend = -1; }
            else if ( lines.length > 1 ) { l = Number(lines[0]); lend = Number(lines[1]); }
            if(act) $scope.lastline = l;
        }

        return {'l':l,'lend':lend,'lstr':lstr};
    }
    
    // Load paper

    $scope.load = function(safe) {
    
        $scope.curl = $scope.parseLine(false).l;

        //if(sync) 
        jQuery.ajaxSetup({async:false});

        $.get( "php/load_paper.php", { paper : $scope.params.paper }, 
            
            function(data) {
            if ( data != "New file created" && data != "" ) {
                
                var saved_comments = JSON.parse(data);
                saved_comments.sort(compare);

                best = null, dist = 1e9;
                if($scope.curl != null) {
                    for (var i in saved_comments)
                    {
                        cline = saved_comments[i].line;
                        if (cline == null || saved_comments[i].type != $('#type').val()) continue;
                        if (Math.abs($scope.curl - cline) < Math.abs(dist))
                        {
                            best = i;
                            dist = $scope.curl - cline;
                        }
                    }
                }

                // Find comments around what you are currently working

                previ = best;
                nexti = Number(best)+1;
                if(dist < 0) { previ = best-1; nexti = best;}
                $scope.clinecomm = {"Prev":"","Cur":"","Next":"","PrevLine":"","NextLine":"","CurAuthor":""};
                if(best != null && dist==0)
                {
                    $scope.clinecomm.Cur = reformat(saved_comments[best].comment,1)
                    $scope.clinecomm.CurAuthor = saved_comments[best].author;
                    previ = best-1;
                }
                if(best != null && previ >= 0) {
                    if(saved_comments[previ].type=='Main') {
                        $scope.clinecomm.Prev = reformat(saved_comments[previ].comment,1);
                        $scope.clinecomm.PrevLine = saved_comments[previ].lstr.replace(",","-");
                    }
                }
                if(best != null &&  nexti < saved_comments.length) {
                    $scope.clinecomm.Next = reformat(saved_comments[nexti].comment,1);
                    $scope.clinecomm.NextLine = saved_comments[nexti].lstr.replace(",","-");
                }

                // Format comments
                for (var i in saved_comments)
                {
                    curcmt = saved_comments[i];
                    curcmt.comment = reformat(curcmt.comment); 
                }

                // Check if modified
                if($scope.curcomm != null) 
                {
                    var modcomm = getByHash(saved_comments,$scope.curcomm);
                    var mycomm  = getByHash($scope.params.comments,$scope.curcomm);

                    if ( safe && modcomm != null && modcomm.comment != mycomm.comment && !$scope.alerted ) {
                        alert("Sombody just modified the comment you are currently modifying. If you save now you will overwrite his modifications."); 
                        $scope.alerted = true;
                    }
                }
                $scope.params.comments = saved_comments;
            }
            else $scope.params.comments = [];

            //if(sync) jQuery.ajaxSetup({async:true});
            $('#clicktoreload').click();
        });
    }

    $scope.load();

    // Button functions definition: Save, Clear, Go to comment, Download comments as file

    $scope.save = function(erase) {

        if (erase===undefined) erase = false;
        ok = true;
        if (erase) ok = confirm("Are you sure you want to erase this comment?"); 
        if(!ok) return; 

        // Parse form

        lineparse = $scope.parseLine();

        sec = $('#section').val();
        sec = sec.replace(" ","");
        sec = sec.replace("sec","");
        sec = sec.replace("Sec.","");
        sec = sec.replace("Sec","");
        sec = sec.replace("app","");
        sec = sec.replace("App.","");
        sec = sec.replace("App","");

        comm = {
            hash     : generateUUID(),
            severity : $('#severity').val(),
            type     : $('#type').val(),
            comment  : $('#comment').val(),
            lstr     : lineparse.lstr,
            line     : lineparse.l,
            line_end : lineparse.lend,
            issue    : $('#issue').val(),
            section  : sec,
            author   : $scope.params.author
        };

        // Decide action
        var operation = "add";
        if ($scope.curcomm === null) 
        {  
            if (comm.type=="Main") {
                prevcomm = getByLines($scope.params.comments, comm.line, comm.line_end, comm.lstr, comm.type);
            
                if ( prevcomm != null ) {
                    comm.hash    = prevcomm.hash;
                    comm.comment = prevcomm.comment+"\n\n"+comm.comment;
                    if (comm.author.indexOf($scope.params.author)<0)
                        comm.author  = comm.author+";"+$scope.params.author;
                    operation    = "modify";
                }
            }
        }
        else 
        {
            comm.hash = $scope.curcomm;
            if (erase) operation = "erase";
            else operation = "modify";
        }
    
        // Call saving script
        comm.comment = comm.comment.replace(/\n/g,"--nl--");
        comm.comment = comm.comment.replace(/"/g,"--dq--");
        $.get( "php/save.php", 
            { paper : $scope.params.paper, operation : operation, comment : JSON.stringify(comm) }, 
    
            function(data)
            {
                if(data.indexOf('Fail') > -1)
                {
                    alert("Something is wrong. But don't worry, this is part of an ongoing \
                        bug inverstigation. All is backuped. Please stop using the website and inform Luca.\
                        It would be useful if you could report what you wrote in your last comment.");
                }

                $scope.load(false);

                $('#severity').val("Minor");
                $('#comment').val("");
                $('#lines').val("");
                $('#issue').val("Unspecified");

                if (comm.type=="Main" || comm.type=="References") $('#lines').focus();
                else if (comm.type=="References") $('#refs').focus();
                else $('#comment').focus();
            }
        );

        // Reset environment variables
        $scope.curcomm = null;
        $scope.erase_enabled = true;
    }

    $scope.go = function(comment) {

        $scope.curcomm = comment.hash;
        $scope.erase_enabled = false;
        $scope.lastline = comment.line;
        $scope.alerted = false;
        $scope.CommentType = comment.type;

        $('#severity').val(comment.severity);
        $('#type').val(comment.type);
        $('#comment').val(comment.comment);
        $('#lines').val(comment.lstr);
        $('#refs').val(comment.lstr);
        $('#issue').val(comment.issue);
        $('#section').val(comment.section);

        $('html, body').animate({ scrollTop: 0 }, 'fast');
        $('#clicktoreload').click();
    }

    $scope.clear = function(comment) {

        $scope.curcomm = null;
        $scope.erase_enabled = true;        

        $('#opt-Main').selected = "true";
        $scope.CommentType='Main';

        $('#severity').val("Minor");
        $('#type').val("Main");
        $('#comment').val("");
        $('#lines').val("");
        $('#issue').val("Unspecified");
        $('#section').val("");
    }
    
    $scope.show = function(comment) {
        var authCheked = $('#author_checkbox').prop('checked');
        var sevCheked = $('#severity_checkbox').prop('checked');
        var authorOK = ( !authCheked || (authCheked && 
                comment.author.indexOf($scope.params.author)>-1));
        var severityOK = ( !sevCheked || (sevCheked && comment.severity=="Major"));

        return (authorOK && severityOK);
    }

    $scope.download = function() {

        // Create text
        var text = "";

        text += "Dear proponents,\n\n";
        text += "congratulations for this analysis. Find here our comments.\n\n";
        text += "Best regards,\nthe EPFL group\n\n";

        text += "------------------------\n";
        text += "General Comments\n";
        text += "------------------------\n\n";

        cmts = $scope.params.comments;
        cmts.sort(compare);
        for (i in cmts) {
            if (cmts[i].type=="General") text += "-- " + cmts[i].comment.replace(/\n\n/g,"\n    ") +"\n"; 
        }

        text += "\n------------------------\n";
        text += "Abstract\n";
        text += "------------------------\n\n";
        for (i in cmts) {
            if (cmts[i].type=="Abstract") text += "-- " + cmts[i].comment.replace(/\n\n/g,"\n    ") +"\n";
        }

        text += "\n------------------------\n";
        text += "Main text\n";
        text += "------------------------\n\n"; 
        prevsection = null;
        for (i in cmts) {
            if (cmts[i].type=="Main") 
            {
                if(cmts[i].section!=prevsection && cmts[i].section!="") 
                {
                    text += "\n*** Sec " + cmts[i].section + "\n\n";
                    prevsection = cmts[i].section;
                }

                if(cmts[i].lstr.indexOf("Tab") > -1 || 
                   cmts[i].lstr.indexOf("Eq") > -1 ||
                   cmts[i].lstr.indexOf("Fig") > -1 ) 
                    text += "-- "+cmts[i].lstr;
                else {
                    text += "-- L"+cmts[i].line;
                    if(cmts[i].line_end > 0) text += "-"+cmts[i].line_end;
                }

                text += ":  "+ cmts[i].comment.replace(/\n\n/g,"\n\n        ") +"\n";
            }
        }

        text += "\n------------------------\n";
        text += "References\n";
        text += "------------------------\n\n";
        for (i in cmts) {
            if (cmts[i].type=="References") text += "-- " + cmts[i].comment.replace(/\n\n/g,"\n    ") +"\n";
        }

        // Write to file and download
        var file = new Blob([text], {type : 'text/plain'});
        url = window.URL.createObjectURL(file);

        var a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        a.href = url;
        a.target="_blank";
        a.download = $scope.params.paper+".txt";
        a.click();
    }

    window.setInterval(function(){ $scope.load(); }, 2000);
});


