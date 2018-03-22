// カート用に _standard.js をベースに作成
//
//   _standard.jsからの変更点
//		右側固定
//		ギア表示を削除
//		RevLimitを超えた時のタコメータ点滅を削除
//		現在走行中のLapNoを表示
//		グラフのスピードとタコの色を変更
//
//  更新履歴
//		2018.03.21	1.0		新規作成

//*** 初期化処理 ************************************************************

function Initialize(){

	// ひとまず右側固定
	var MeterRight = 1;

	// 使用する画像・フォントの宣言
	ImgMeter = new Image( Vsd.SkinDir + "standard.png" );
	ImgG     = new Image( ImgMeter );
	
	Scale = Vsd.Height / 720;
	
	FontS = new Font( "Impact", 24 * Scale );
	FontM = new Font( "Impact", 31 * Scale );
	FontG = new Font( "Impact", 40 * Scale );
	FontL = new Font( "Impact", 60 * Scale );
	FontM_Outline = new Font( "Impact", 36 * Scale, FONT_FIXED | FONT_OUTLINE );
	
	// 動画サイズに応じてメーター画像をリサイズ
	if( Scale != 1 ){
		ImgMeter.Resize( ImgMeter.Width * Scale, ImgMeter.Height * Scale );
	}
	
	// メータ描画用パラメータ作成
	MeterX	= MeterRight ? Vsd.Width  - ImgMeter.Width : 0;
	MeterY	= Vsd.Height - ImgMeter.Height * 0.85;
	MeterR  = 150 * Scale;
	MeterR2 = 126 * Scale;
	
	MeterParam = {
		X:			MeterX + MeterR,
		Y:			MeterY + MeterR,
		R:			MeterR2,
		Line1Len:	MeterR2 * 0.1,
		Line1Width:	2,
		Line1Color:	0xFFFFFF,
		Line1Cnt:	12,
		Line2Len:	MeterR2 * 0.05,
		Line2Width:	1,
		Line2Color:	0xFFFFFF,
		Line2Cnt:	5,
		NumR:		MeterR2 * 0.78,
		FontColor:	0xFFFFFF,
		Font:		FontS,
		MinAngle:	135,
		MaxAngle:	45,
		MinVal:		0,
		MaxVal:		0,	// 暫定
	};
	
	// G 用画像をリサイズ
	ImgG.Resize( ImgG.Width * Scale / 2, ImgG.Height * Scale / 2 );
	
	// G メーター用の座標計算
	MeterGX	 = MeterRight ? Vsd.Width - ImgMeter.Width * 1.45 : ImgMeter.Width * 0.95;
	MeterGY	 = Vsd.Height - ImgG.Height;
	MeterGR  = MeterR / 2;
	MeterGR2 = MeterParam.R / 2;
	MeterGCx = MeterGX + MeterGR;
	MeterGCy = MeterGY + MeterGR;
	
	// スピードグラフサイズ計算
	SpdX1 = MeterRight ? 8 : ImgMeter.Width * 1.6;
	SpdX2 = MeterRight ? Vsd.Width - ImgMeter.Width * 1.6 : Vsd.Width - 8;
	SpdY1 = Vsd.Height - 300 * Scale;
	SpdY2 = Vsd.Height - 8;
	
	// スピードメータ用最高速計算
	if( Log.Max.Tacho > 0 ){
		MaxTacho			= Math.ceil( Log.Max.Tacho / 1000 ) * 1000;
		MeterParam.MaxVal	= ~~( MaxTacho / 1000 );
		MeterParam.Font		= FontM;
	}else{
		MaxSpeed			= Math.ceil( Log.Max.Speed / 10 ) * 10;
		MeterParam.MaxVal	= MaxSpeed;
	}
	
	// グラフ用パラメータ生成
	GraphParam = [
		"Speed",	"%.0f km/h",	0xFF4000,
		"Tacho",	"%.0f rpm",		0x00FFFF,
	//	"Accel",	"%.0f %%",		0x00FF00,
	//	"TurnR",	"%.0f m",		0x00FF00,
		"Gx",		"%.2f G[lat]",	0x00FF00,
		"Gy",		"%.2f G[lon]",	0xFF00FF,
	];
}

//*** メーター描画処理 ******************************************************

function Draw(){
	// メーター画像描画
	Vsd.PutImage( MeterX, MeterY, ImgMeter );
	
	if( Log.Max.Tacho > 0 ){
		MeterParam.Line1Color =
		MeterParam.Line2Color =
		MeterParam.FontColor = 0xFFFFFF;
		
		// タコメーター目盛り描画
		Vsd.DrawRoundMeterScale( MeterParam );
		
	}else{
		// スピードメーター目盛り描画
		Vsd.DrawRoundMeterScale( MeterParam );
	}
	
	// スピード数値表示
	Vsd.DrawTextAlign(
		MeterParam.X, MeterParam.Y + MeterR * 0.25, 
		ALIGN_HCENTER | ALIGN_VCENTER,
		~~Log.Speed, FontL, 0xFFFFFF
	);
	
	Vsd.DrawTextAlign(
		MeterParam.X, MeterParam.Y + MeterR * 0.5,
		ALIGN_HCENTER | ALIGN_VCENTER,
		"km/h", FontS, 0xFFFFFF
	);
	
	if( Log.Max.Tacho > 0 ){
		// タコメーター針
		Vsd.DrawNeedle(
			MeterParam.X, MeterParam.Y, MeterParam.R * 0.95, MeterParam.R * -0.1,
			135, 45, Log.Tacho / MaxTacho, 0xFF0000, 4 * Scale
		);
	}else{
		// スピードメーター針
		Vsd.DrawNeedle(
			MeterParam.X, MeterParam.Y, MeterParam.R * 0.95, MeterParam.R * -0.1,
			135, 45, Log.Speed / MaxSpeed, 0xFF0000, 4 * Scale
		);
	}
	
	// アクセル
	if( Log.Max.Accel > 0 ){
		Vsd.DrawLine(
			MeterParam.X - MeterR * 0.45,
			MeterParam.Y + MeterR * 0.65,
			MeterParam.X + MeterR * 0.45,
			MeterParam.Y + MeterR * 0.65,
			0x404040, 4 * Scale
		);
		Vsd.DrawLine(
			MeterParam.X - MeterR * 0.45,
			MeterParam.Y + MeterR * 0.65,
			MeterParam.X + MeterR * 0.45 * ( 2 * Log.Accel / Log.Max.Accel - 1 ),
			MeterParam.Y + MeterR * 0.65,
			0x00C0C0, 4 * Scale
		);
	}
	
	if( Log.Gx !== undefined ){
		// Gメーターパネル画像描画
		Vsd.PutImage( MeterGX, MeterGY, ImgG );
		Vsd.DrawLine( MeterGCx - MeterGR2, MeterGCy, MeterGCx + MeterGR2, MeterGCy, 0x802000 );
		Vsd.DrawLine( MeterGCx, MeterGCy - MeterGR2, MeterGCx, MeterGCy + MeterGR2, 0x802000 );
		Vsd.DrawCircle( MeterGCx, MeterGCy, MeterGR2 / 3,     0x802000 );
		Vsd.DrawCircle( MeterGCx, MeterGCy, MeterGR2 / 3 * 2, 0x802000 );
		
		// G 数値
		var Accel = Math.sqrt( Log.Gx * Log.Gx + Log.Gy * Log.Gy ).toFixed( 1 ) + "G";
		Vsd.DrawTextAlign(
			MeterGCx, MeterGCy + MeterR / 2, ALIGN_HCENTER | ALIGN_BOTTOM,
			Accel, FontS, 0xFFFFFF
		);
		
		// G スネーク
		Vsd.DrawGSnake(	MeterGCx, MeterGCy, MeterGR2 / 1.5, 5 * Scale, 2, 0xFF4000, 0x802000 );
	}
	
	// 走行軌跡
	Vsd.DrawMap(
		8 * Scale, 8 * Scale, 500 * Scale, 300 * Scale,
		ALIGN_TOP | ALIGN_LEFT,
		3 * Scale, 6 * Scale, 0xFF0000, 0xFFFF00, 0x00FF00, 0xFF0000,
		Vsd.Config_map_length
	);
	
	// ラップタイム
	Vsd.DrawLapTime( Vsd.Width - 1, 0, ALIGN_TOP | ALIGN_RIGHT, FontM_Outline);
	
	// グラフ
	Vsd.DrawGraph( SpdX1, SpdY1, SpdX2, SpdY2, FontM, GRAPH_VTILE, GraphParam );

	// 現在走行中のLapNo
	var BufStr
	if(Vsd.LapCnt <= Vsd.MaxLapCnt)
		BufStr ="LapNo. " + (Vsd.LapCnt - 1);
	else
		BufStr ="Finish";

	Vsd.DrawTextAlign(Vsd.Width - 180, 280, ALIGN_LEFT | ALIGN_VCENTER, BufStr ,FontM_Outline);
}
