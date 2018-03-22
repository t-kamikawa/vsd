// Mychron5データ用ログリーダ
//
//	データをエクスポートする際は、
// 「全チャンネル」「距離/タイム」でCSVファイルにエクスポートしてください。
//
//  更新履歴
//		2018.03.21	1.0		新規作成

LogReaderInfo.push({
	Caption:	"Mychron5 (*.csv)",
	Filter:		"*.csv",
	ReaderFunc:	"Mychron5_csv"
});

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

	const METADATA_CNT	= 13; // メタデータの行数
	const DATA_START	= 20; // レコードデータ開始位置

	// Mychron5からエクスポートしたCSVファイル内の位置
	const LOG_TIME		= 0;
	const LOG_SPEED		= 11;
	const LOG_TACHO		= 10;
	const LOG_DISTANCE	= 1;
	const LOG_LONGITUDE	= 22;
	const LOG_LATITUDE	= 23;
	const LOG_GX		= 13;
	const LOG_GY		= 14;
	const HEADER_DATA_NAME = 0;
	const HEADER_DATA_VALE = 1;

	var SampleRate = 0; //データ採取の間隔
	var SampleDateTime;
	var SampleDate;
	var SampleTime;

	var	Cnt = 0;
	var Line;
	var Buf	= '';
	var BufSampleDateTime;

	var BufLogTime 	= 0; // 前のレコードのLOG_TIME
	var LapStartCnt = 0; // コントロールラインを横切った瞬間のデータ位置
	
	for(var i = 0; i < Files.length; ++i ){
		var file = new File();
		try{
			file.Open(Files[i], "rb");

		}catch(e){
			MessageBox("ファイルが開けません: " + Files[i]);
			return 0;
		}
		
		// メタデータ部分から値を取得する
		for(var i = 0; i < METADATA_CNT; ++i){
			DataArray = file.ReadLine().replace(/\"/g, "").split(",");

			// データ採取日
			if(DataArray[HEADER_DATA_NAME] == "Date"){
				SampleDate = DataArray[HEADER_DATA_VALE];
			}

			// データ採取時間
			if(DataArray[HEADER_DATA_NAME] == "Time"){
				SampleTime = DataArray[HEADER_DATA_VALE];
			}

			// データ採取間隔
			if(DataArray[HEADER_DATA_NAME] == "Sample Rate"){
				SampleRate = 1000 / parseInt(DataArray[HEADER_DATA_VALE]);
			}
		}

		// ヘッダー名部分をスキップ
		for(var i = METADATA_CNT; i < DATA_START; ++i){
			Buf = file.ReadLine();
		}
		
		// データ採取開始日時の取得
		SampleDateTime = new Date(SampleDate + " " +  SampleTime);

		// データ採取開始日時の1970年1月1日0時0分0秒（UTC）からの秒数（ミリ秒単位）を取得
		BufSampleDateTime = SampleDateTime.getTime();

		while(1){
			
			// 取得データの分割
			DataArray = Buf.split(",");
			
			// 各データをLogオブジェクトに格納する
			Log.Speed[Cnt] 		= DataArray[LOG_SPEED];		// スピード
			Log.Tacho[Cnt] 		= DataArray[LOG_TACHO];		// エンジン回転数
			Log.Longitude[Cnt] 	= DataArray[LOG_LONGITUDE];	// 経度
			Log.Latitude[Cnt] 	= DataArray[LOG_LATITUDE];	// 緯度
			Log.Gx[Cnt] 		= DataArray[LOG_GX]; 		// 左右方向の加速度
			Log.Gy[Cnt] 		= DataArray[LOG_GY]; 		// 前後方向の加速度
		
			// コントロールラインを横切った瞬間のレコードに、そのラップのラップタイムを格納する
			//   ラップタイムを横切った瞬間のレコードを検知
			//   一つ前のレコードのLOG_TIMEが 0 以外で、カレントレコードのLOG_TIMEが 0 でなければ
			//   カレントのレコードがコントロールラインを横切ったレコードとし以下の処理を行う
			//   1) LapStartCntの位置のレコードに、そのラップのラップタイム(一つ前のレコードのLOG_TIME)を格納する
			//   2) LapStartCntに今のレコード位置を格納する。
			if(BufLogTime != 0 && DataArray[LOG_TIME] == 0){
				Log.LapTime[LapStartCnt] = BufLogTime * 1000;
				LapStartCnt = Cnt;
			}
			// カレントのLOG_TIMEを格納する
			BufLogTime = DataArray[LOG_TIME];

			if(file.IsEOF()) break;

			// 次のデータ読み込み
			Buf = file.ReadLine();

			Log.Time[Cnt] = BufSampleDateTime + SampleRate * Cnt;
			
			++Cnt;
		}
		file.Close();
	}

	return Cnt;
}
