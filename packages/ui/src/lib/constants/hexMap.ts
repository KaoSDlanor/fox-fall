export enum Hex {
	BasinSionnach = 'Basin Sionnach',
	SpeakingWoods = 'Speaking Woods',
	HowlCounty = 'Howl County',
	CallumsCape = 'Callum\'s Cape',
	ReachingTrail = 'Reaching Trail',
	ClansheadValley = 'Clanshead Valley',
	NevishLine = 'Nevish Line',
	TheMoors = 'The Moors',
	ViperPit = 'Viper Pit',
	MorgensCrossing = 'Morgen\'s Crossing',
	TheOarbreakerIsles = 'The Oarbreaker Isles',
	Stonecradle = 'Stonecradle',
	CallahansPassage = 'Callahan\'s Passage',
	WeatheredExpanse = 'Weathered Expanse',
	Godcrofts = 'Godcrofts',
	FarranacCoast = 'Farranac Coast',
	TheLinnOfMercy = 'The Linn of Mercy',
	MarbanHollow = 'Marban Hollow',
	StlicanShelf = 'Stlican Shelf',
	FishermansRow = 'Fisherman\'s Row',
	KingsCage = 'King\'s Cage',
	Deadlands = 'Deadlands',
	TheClahstra = 'The Clahstra',
	TempestIsland = 'Tempest Island',
	Westgate = 'Westgate',
	LochMor = 'Loch Mór',
	TheDrownedVale = 'The Drowned Vale',
	EndlessShore = 'Endless Shore',
	StemaLanding = 'Stema Landing',
	Sableport = 'Sableport',
	UmbralWildwood = 'Umbral Wildwood',
	AllodsBight = 'Allod\'s Bight',
	TheFingers = 'The Fingers',
	Origin = 'Origin',
	TheHeartlands = 'The Heartlands',
	ShackledChasm = 'Shackled Chasm',
	ReaversPass = 'Reaver\'s Pass',
	AshFields = 'Ash Fields',
	GreatMarch = 'Great March',
	Terminus = 'Terminus',
	RedRiver = 'Red River',
	Acrithia = 'Acrithia',
	Kalokai = 'Kalokai',
}

export const HEX_POSITIONS = [
	[undefined,              undefined,              Hex.BasinSionnach,      undefined,              undefined,              ],
	[            undefined,              Hex.SpeakingWoods,      Hex.HowlCounty,         undefined                           ],
	[undefined,              Hex.CallumsCape,        Hex.ReachingTrail,      Hex.ClansheadValley,    undefined               ],
	[            Hex.NevishLine,         Hex.TheMoors,           Hex.ViperPit,           Hex.MorgensCrossing                 ],
	[Hex.TheOarbreakerIsles, Hex.Stonecradle,        Hex.CallahansPassage,   Hex.WeatheredExpanse,   Hex.Godcrofts           ],
	[            Hex.FarranacCoast,      Hex.TheLinnOfMercy,     Hex.MarbanHollow,       Hex.StlicanShelf                    ],
	[Hex.FishermansRow,      Hex.KingsCage,          Hex.Deadlands,          Hex.TheClahstra,        Hex.TempestIsland       ],
	[            Hex.Westgate,           Hex.LochMor,            Hex.TheDrownedVale,     Hex.EndlessShore                    ],
	[Hex.StemaLanding,       Hex.Sableport,          Hex.UmbralWildwood,     Hex.AllodsBight,        Hex.TheFingers          ],
	[            Hex.Origin,             Hex.TheHeartlands,      Hex.ShackledChasm,      Hex.ReaversPass                     ],
	[undefined,              Hex.AshFields,          Hex.GreatMarch,         Hex.Terminus,           undefined               ],
	[            undefined,              Hex.RedRiver,           Hex.Acrithia,           undefined                           ],
	[undefined,              undefined,              Hex.Kalokai,            undefined,              undefined               ],
];
