<?php

$myFileName = "../papers/".$_GET["paper"].".json";

$cmtstr=$_GET["comment"];
$cmtstr = str_replace("\\", "", $cmtstr);
$cmt = json_decode($cmtstr);
$opt = $_GET["operation"];

if (!file_exists($myFileName)) die("Error file does not exist");
copy($myFileName,"../backups/".$_GET["paper"]."-bak.json");
$filecont = file_get_contents($myFileName);
$cmts = json_decode($filecont);

if($opt=="add") 
{
    array_push($cmts, $cmt);
    echo "add\n";
}
elseif($opt=="modify")
{
    foreach ($cmts as &$curcmt) 
    {
        if($curcmt->hash==$cmt->hash) {
            $curcmt = $cmt;
            break;
        }
    }
    echo "modify";
} 
elseif($opt=="erase")
{
    foreach($cmts as $i=>$curcmt) {
        if($curcmt->hash == $cmt->hash) {
            break;
        }
    }
    array_splice($cmts, $i, 1);
    echo "erase ";
}
else 
{
    die("Wrong option passed: add, modify or erase.");
}

$text = json_encode($cmts);

if (is_null($text) or $text=='null')
{
    echo "Fail!";
}
else
{
    $myfile = fopen($myFileName, "w") or die("Unable to open file ".$myFileName);
    fwrite($myfile,$text);
    fclose($myfile);
    echo "Success!";
}


?>
