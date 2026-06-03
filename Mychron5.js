// Mychron5データ用ログリーダ
//
//	データをエクスポートする際は、
// 「全チャンネル」「距離/タイム」でCSVファイルにエクスポートしてください。
//
//  更新履歴
//		2018.03.21	1.0		新規作成
//		2026.06.01	1.1		RS2/RS3のCSVフォーマットに対応

LogReaderInfo.push({
	Caption:	"Mychron5 (*.csv)",
	Filter:		"*.csv",
	ReaderFunc:	"Mychron5_csv"
});

function Mychron5_ParseCsvLine( Line ){
	var Result = [];
	var Value = "";
	var InQuote = false;

	for( var Pos = 0; Pos < Line.length; ++Pos ){
		var Ch = Line.charAt(Pos);

		if( Ch == "\"" ){
			if( InQuote && Line.charAt(Pos + 1) == "\"" ){
				Value += "\"";
				++Pos;
			}else{
				InQuote = !InQuote;
			}
		}else if( Ch == "," && !InQuote ){
			Result.push(Value);
			Value = "";
		}else{
			Value += Ch;
		}
	}

	Result.push(Value.replace(/\r$/, ""));
	return Result;
}

function Mychron5_NormalizeHeaderName( Name ){
	return String(Name).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function Mychron5_FindColumn( Header, Names ){
	for( var NameCnt = 0; NameCnt < Names.length; ++NameCnt ){
		var TargetName = Mychron5_NormalizeHeaderName(Names[NameCnt]);

		for( var HeaderCnt = 0; HeaderCnt < Header.length; ++HeaderCnt ){
			if( Mychron5_NormalizeHeaderName(Header[HeaderCnt]) == TargetName ){
				return HeaderCnt;
			}
		}
	}

	return -1;
}

function Mychron5_IsDataHeader( DataArray ){
	if( DataArray.length < 2 ){
		return false;
	}

	return Mychron5_NormalizeHeaderName(DataArray[0]) == "time"
		&& (Mychron5_FindColumn(DataArray, ["GPS Speed", "GPS_Speed"]) >= 0
			|| Mychron5_FindColumn(DataArray, ["RPM"]) >= 0);
}

function Mychron5_IsNumeric( Value ){
	return /^-?[0-9]+(\.[0-9]+)?$/.test(String(Value).replace(/^\s+|\s+$/g, ""));
}

function Mychron5_GetValue( DataArray, Column ){
	if( Column < 0 || Column >= DataArray.length ){
		return "";
	}

	return DataArray[Column];
}

function Mychron5_AddNumberValues( Values, DataArray, StartPos ){
	for( var DataCnt = StartPos; DataCnt < DataArray.length; ++DataCnt ){
		var SplitValues = String(DataArray[DataCnt]).split(",");

		for( var SplitCnt = 0; SplitCnt < SplitValues.length; ++SplitCnt ){
			var Value = parseFloat(SplitValues[SplitCnt]);

			if( !isNaN(Value) ){
				Values.push(Value);
			}
		}
	}
}

function Mychron5_ParseLapTime( Value ){
	var TimeValue = String(Value);
	var TimeArray = TimeValue.split(":");

	if( TimeArray.length == 1 ){
		return parseFloat(TimeArray[0]);
	}

	if( TimeArray.length == 2 ){
		return parseFloat(TimeArray[0]) * 60 + parseFloat(TimeArray[1]);
	}

	return parseFloat(TimeArray[0]) * 3600 + parseFloat(TimeArray[1]) * 60 + parseFloat(TimeArray[2]);
}

function Mychron5_AddLapTimeValues( Values, DataArray, StartPos ){
	for( var DataCnt = StartPos; DataCnt < DataArray.length; ++DataCnt ){
		var Value = Mychron5_ParseLapTime(DataArray[DataCnt]);

		if( !isNaN(Value) ){
			Values.push(Value);
		}
	}
}

function Mychron5_csv( Files ){
	
	Log.Time		= []; // レコード時間
	Log.Speed		= []; // スピード
	Log.Tacho		= []; // エンジン回転数
	Log.Distance	= []; // 走行距離
	Log.Longitude	= []; // 経度
	Log.Latitude	= []; // 緯度
	Log.Gx			= []; // 左右方向の加速度
	Log.Gy			= []; // 前後方向の加速度
	Log.LapTime		= []; // ラップタイム

	var HEADER_DATA_NAME = 0;
	var HEADER_DATA_VALUE = 1;

	var SampleRate = 0; // データ採取の間隔
	var SampleDateTime;
	var SampleDate;
	var SampleTime;

	var	Cnt = 0;
	var Buf	= '';
	var BufSampleDateTime;
	var DataArray;

	var BufLogTime; // 前のレコードのLOG_TIME
	var LapStartCnt; // コントロールラインを横切った瞬間のデータ位置
	
	for(var FileCnt = 0; FileCnt < Files.length; ++FileCnt ){
		var file = new File();
		try{
			file.Open(Files[FileCnt], "rb");

		}catch(e){
			MessageBox("ファイルが開けません: " + Files[FileCnt]);
			return 0;
		}
		
		var Header = null;
		var BeaconMarkers = [];
		var SegmentTimes = [];
		SampleRate = 0;
		SampleDate = "";
		SampleTime = "";
		BufLogTime = 0;
		LapStartCnt = Cnt;

		// メタデータ部分から値を取得し、データヘッダー行を探す
		while( !file.IsEOF() ){
			DataArray = Mychron5_ParseCsvLine(file.ReadLine());
	
			// データ採取日
			if(DataArray.length == 2 && DataArray[HEADER_DATA_NAME] == "Date"){
				SampleDate = DataArray[HEADER_DATA_VALUE];
			}

			// データ採取時間
			if(DataArray.length == 2 && DataArray[HEADER_DATA_NAME] == "Time"){
				SampleTime = DataArray[HEADER_DATA_VALUE];
			}

			// データ採取間隔
			if(DataArray.length == 2 && DataArray[HEADER_DATA_NAME] == "Sample Rate"){
				SampleRate = 1000 / parseInt(DataArray[HEADER_DATA_VALUE]);
			}

			if(DataArray[HEADER_DATA_NAME] == "Beacon Markers"){
				Mychron5_AddNumberValues(BeaconMarkers, DataArray, 1);
			}

			if(DataArray[HEADER_DATA_NAME] == "Segment Times"){
				Mychron5_AddLapTimeValues(SegmentTimes, DataArray, 1);
			}

			if( Mychron5_IsDataHeader(DataArray) ){
				Header = DataArray;
				break;
			}
		}

		if( Header == null ){
			file.Close();
			MessageBox("データヘッダー行が見つかりません: " + Files[FileCnt]);
			return 0;
		}

		var LOG_TIME		= Mychron5_FindColumn(Header, ["Time"]);
		var LOG_SPEED		= Mychron5_FindColumn(Header, ["GPS Speed", "GPS_Speed"]);
		var LOG_TACHO		= Mychron5_FindColumn(Header, ["RPM"]);
		var LOG_DISTANCE	= Mychron5_FindColumn(Header, ["Distance", "Distance on GPS Speed"]);
		var LOG_LONGITUDE	= Mychron5_FindColumn(Header, ["GPS Longitude", "GPS_Longitude"]);
		var LOG_LATITUDE	= Mychron5_FindColumn(Header, ["GPS Latitude", "GPS_Latitude"]);
		var LOG_GX			= Mychron5_FindColumn(Header, ["AccelerometerX"]);
		var LOG_GY			= Mychron5_FindColumn(Header, ["AccelerometerY"]);
		var USE_BEACON_LAP	= Mychron5_FindColumn(Header, ["Distance on GPS Speed"]) >= 0;
		var LogFormat		= USE_BEACON_LAP ? "RS3" : "RS2";
		var BeaconCnt		= 0;

		// RS2の一部環境ではGPS Longitudeの列名が文字化けするため、GPS Latitudeの次列を使う
		if( LOG_LONGITUDE < 0 && LOG_LATITUDE >= 0 && LOG_LATITUDE + 1 < Header.length ){
			LOG_LONGITUDE = LOG_LATITUDE + 1;
		}

		if( LOG_TIME < 0 || LOG_SPEED < 0 || LOG_TACHO < 0 || LOG_LONGITUDE < 0 || LOG_LATITUDE < 0 ){
			file.Close();
			MessageBox("必要なデータ列が見つかりません: " + Files[FileCnt]);
			return 0;
		}

		MessageBox(LogFormat + "形式のログとして読み込みます: " + Files[FileCnt]);
		
		// データ採取開始日時の取得
		SampleDateTime = new Date(SampleDate + " " +  SampleTime);

		// データ採取開始日時の1970年1月1日0時0分0秒（UTC）からの秒数（ミリ秒単位）を取得
		BufSampleDateTime = SampleDateTime.getTime();

		while( !file.IsEOF() ){
			Buf = file.ReadLine();

			// 取得データの分割
			DataArray = Mychron5_ParseCsvLine(Buf);

			if( !Mychron5_IsNumeric(DataArray[LOG_TIME]) ){
				continue;
			}

			var LogTime = parseFloat(DataArray[LOG_TIME]);
			
			// 各データをLogオブジェクトに格納する
			Log.Speed[Cnt] 		= DataArray[LOG_SPEED];		// スピード
			Log.Tacho[Cnt] 		= DataArray[LOG_TACHO];		// エンジン回転数
			Log.Distance[Cnt] 	= Mychron5_GetValue(DataArray, LOG_DISTANCE);	// 走行距離
			Log.Longitude[Cnt] 	= DataArray[LOG_LONGITUDE];	// 経度
			Log.Latitude[Cnt] 	= DataArray[LOG_LATITUDE];	// 緯度
			Log.Gx[Cnt] 		= Mychron5_GetValue(DataArray, LOG_GX); 		// 左右方向の加速度
			Log.Gy[Cnt] 		= Mychron5_GetValue(DataArray, LOG_GY); 		// 前後方向の加速度
			Log.Time[Cnt] 		= BufSampleDateTime + SampleRate * Cnt;
		
			// コントロールラインを横切った瞬間のレコードに、そのラップのラップタイムを格納する
			//   ラップタイムを横切った瞬間のレコードを検知
			//   一つ前のレコードのLOG_TIMEが 0 以外で、カレントレコードのLOG_TIMEが 0 でなければ
			//   カレントのレコードがコントロールラインを横切ったレコードとし以下の処理を行う
			//   1) LapStartCntの位置のレコードに、そのラップのラップタイム(一つ前のレコードのLOG_TIME)を格納する
			//   2) LapStartCntに今のレコード位置を格納する。
			if( USE_BEACON_LAP ){
				while( BeaconCnt < BeaconMarkers.length && LogTime >= BeaconMarkers[BeaconCnt] ){
					if( BeaconCnt < SegmentTimes.length ){
						Log.LapTime[LapStartCnt] = SegmentTimes[BeaconCnt] * 1000;
					}else if( BeaconCnt == 0 ){
						Log.LapTime[LapStartCnt] = BeaconMarkers[BeaconCnt] * 1000;
					}else{
						Log.LapTime[LapStartCnt] = (BeaconMarkers[BeaconCnt] - BeaconMarkers[BeaconCnt - 1]) * 1000;
					}

					LapStartCnt = Cnt;
					++BeaconCnt;
				}
			}else if(BufLogTime != 0 && LogTime == 0){
				Log.LapTime[LapStartCnt] = BufLogTime * 1000;
				LapStartCnt = Cnt;
			}
			// カレントのLOG_TIMEを格納する
			BufLogTime = LogTime;
			
			++Cnt;
		}
		file.Close();
	}

	return Cnt;
}
