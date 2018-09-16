pragma solidity ^0.4.18;

//import "github.com/Arachnid/solidity-stringutils/strings.sol";
/*
contract C {
  using strings for *;
  string public s;

  function foo(string s1, string s2) public {
    s = s1.toSlice().concat(s2.toSlice());
  }
}
*/
import "./strings.sol";
import "./TokenERC20.sol";
import "./RatingAgency.sol";
contract test3 {
    struct TestStruct {
        uint num;
        mapping( uint => uint) testnums;
    }
    mapping( uint => TestStruct) testmapping;
    uint numtest;
    
    event Log( uint num ); 
    event LogBytes32 (uint i, bytes32 b);
    function test3() public {
        TestStruct storage theStruct = testmapping[ numtest++ ];
        theStruct.num = 45;
        theStruct = testmapping[ numtest++ ];
        theStruct.num = 65;
        for (uint i=0;i< numtest; i++){
            Log( testmapping[ i ].num );
        }
        bytes32 b32 = 'veva\0\0@veva.one';
        byte[32] memory b;
        for(i=0; i<20; i++) {
            b[0] = byte( i / 10 + 0x30 );
            b[1] = byte( i % 10 + 0x30 );
            LogBytes32( i, bytesOntoBytes32( b32, b, 4, 2 ) );
        }
    }
    function uint16InserttoBytes32( bytes32 _bytes, uint16 _ui, uint8 _position ) public pure returns ( bytes32 ){
        return bytes32( ( bytes32( _ui ) << ( (15 - _position) * 16 ) ) | _bytes );
    }
    function uint16ToBytes32( uint16 _ui ) public pure returns ( bytes32 ) {
        return bytes32( _ui );
    }
    function bytesOntoBytes32(bytes32 b32, byte[32] b, uint8 start, uint8 length) private pure returns ( bytes32 out ) {
        out = b32;
        for (uint8 i = 0; i < length; i++)
            out |= bytes32(b[ i ]) >> ( (i+start) * 8);
    }
    function getBytes(bytes32 b32) public pure returns (bytes32) {
        return b32;
    }
    function getAByte( bytes32 b32, uint8 num ) public pure returns (byte) {
        return b32[num];
    }
    function getABytes( uint8 num ) public pure returns (byte, byte) {
        bytes32[2] memory a;
        a[0] = 0xdeadbeef;
        a[1] = 0xbeefdead;
        return ( a[0][31-num], a[1][31-num] );
    }
    function avgBytes( bytes32 b32, uint8 num ) public pure returns (bytes32) {
        uint sum = 0;
        for (uint8 i = 0; i < num; i++){
            sum += uint(b32[ i ]);
        }
        return bytes32( sum / num );
    }
    function convertTo8( uint a, uint div) public pure returns (byte) {
        return( byte(a / div));
    }
    function checkAvg( bytes32 _averages, uint8 ibyte ) public pure returns (bytes32 averages) {
        averages = _averages;
        int sum = 5000;
        int n = 50;
        averages |= bytes32( uint8(sum / n) ) << (31 - ibyte) * 8;
    }
    function checkuSubmitBit( ) public pure returns (bytes32){
        return 0x1 << 247;
    }
    function stringToBytes32(string memory source) public pure returns (bytes32 result) {
        bytes memory tempEmptyStringTest = bytes(source);
        if (tempEmptyStringTest.length == 0) return 0x0;

        assembly {
            result := mload(add(source, 32))
        }
    }
}
contract test2 {
    address defaultRa = 0x3dac6baecd2846aced5b514f3ef85cd547bea6bb;
    using strings for *;
    RatingAgency ratingAgency;
    mapping( uint => address ) tokens;
    uint num_tokens;

    uint16 cycle;
    uint time; 
    uint32 token;
    uint16 value;
    uint8 stat;
    address repr;
    uint8 num_analysts; 
    bytes32 avg_answer;
    uint8 r1_avg;
    uint8 r2_avg;
    uint8 sways;
    uint8 winner;

    
    event Log( string str, uint num1, uint num2 );
    event Log4( string str, uint num1, uint num2, uint num3, uint num4 );
    function test2(address _ra) public {
        address ra = _ra == 0 ? defaultRa: _ra;
        ratingAgency = RatingAgency( ra );
    }
  
    function SetRatingAgency(address ra) public {
        ratingAgency = RatingAgency( ra );
        Log( "", ratingAgency.num_tokens(), ratingAgency.num_cycles()  );
    }
    /*
    function TokenERC20(
        uint256 initialSupply,
        string tokenName,
        string tokenSymbol
    */
    event TokenCreated( string name, string symbol, address addr );
    function bootstrapDummyTokens( uint8 _num ) public { 
        uint8 num = _num == 0 ? 4 : _num;
        uint start = num_tokens;
        uint finish = num_tokens+num;
        string memory basename = "MOOLAH_";
        string memory basesymbol = "MOO";
        for ( uint i = start; i < finish; i++ ) {
            string memory name = basename.toSlice().concat(uint2str(num_tokens).toSlice());
            string memory symbol = basesymbol.toSlice().concat(uint2str(num_tokens).toSlice());
            address token = new TokenERC20( 10000, name, symbol );
            tokens[ num_tokens++ ] = token;
            emit TokenCreated( name, symbol, token );
            ratingAgency.tokenCover( token, name, 0 );
        }
    }
    
    address[16] live_tokens = [
        0x86fa049857e0209aa7d9e616f7eb3b3b78ecfdb0, //EOS 
        0xf230b790e05390fc8295f4d3f60332c93bed42e2, // Tronix
        0xd850942ef8811f2a866692a623011bde52a462c1, // VeChain
        0xd26114cd6ee289accf82350c8d8487fedb8a0c07, // OMG
        0xb5a5f22694352c15b00323844ad545abb2b11028, // Icon
        0xb8c77482e45f1f44de1745f52c74426c631bdd52, // BnB
        0xe0b7927c4af23765cb51314a0e0521a9645f0e2a, // Digix
        0xd4fa1460f537bb9085d22c7bccb5dd450ef28e3a, // Populous
        0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2, // Maker
        0x744d70fdbe2ba4cf95131626614a1763df805b9e, // status
        0x168296bb09e24a88805cb9c33356536b980d3fc5, // RHOC
        0xe94327d07fc17907b4db788e5adf2ed424addff6,  // Reputation
        0x5ca9a71b1d01849c0a95490cc00559717fcf0d1d, // Aeternity
        0xcb97e65f07da24d46bcdd078ebebd7c6e6e3d750, // Byteom
        0xb7cb1c96db6b22b0d3d9536e0108d062bd488f74, // Walton
        0x4ceda7906a5ed2179785cd3a40a69ee8bc99c466 // Aeon 
    ];

    string[16] token_names = [ 
        'EOS',
        'Tronix',
        'VeChain',
        'OMG',
        'Icon',
        'BnB',
        'Digix',
        'Populous',
        'Maker',
        'status',
        'RHOC',
        'Reputation',
        'Aeternity',
        'Byteom',
        'Walton',
        'Aeon'
    ];
    
    function bootstrapTokens( ) public { 
        for ( uint i = 0; i < live_tokens.length; i++ ) {
            ratingAgency.tokenCover( live_tokens[i], token_names[i], 0 );
        }
    }
    event RoundInfo(
        uint16 cycle,
        uint time, 
        uint32 token,
        uint16 value,
        uint8 stat,
        address repr,
        uint8 num_analysts, 
        bytes32 avg_answer,
        uint8 r1_avg,
        uint8 r2_avg,
        uint8 sways,
        uint8 winner
    );
    
    event RoundSummary(
        uint16 round, 
        uint8 num_analysts,
        bytes32 avg_answer,
        uint8 r1_avg,
        uint8 r2_avg,
        uint8 sways,
        uint8 winner
    );
    //event TokenInfo( uint32 token_id, address token_addr, string token_name, string token_symbol );
    event LogRound( uint cycle, uint round, uint token, uint num_analysts);
    function bootstrapRound( uint16 _cycle, uint32 _token ) public {
        ratingAgency.cycleGenerateAvailabilities( _cycle );
        ratingAgency.roundActivate( _cycle, _token );
        uint16 round = ratingAgency.num_rounds() - 1;  
        ( round, cycle, token, value, stat, num_analysts) = ratingAgency.roundInfo( round ); 
        LogRound(cycle, round, token, num_analysts );        
    }
    function bootstrapSurveys( uint16 _round ) public {
        ( _round, cycle, token, value, stat, num_analysts) = ratingAgency.roundInfo( _round ); 
        LogRound(cycle, _round, token, num_analysts );
        /* generate surveys */
        for ( uint8 a = 2; a < num_analysts; a++ ) {
            bytes32 answers = "hello";
            byte qualitatives = 6;
            uint8 recommendation = 1;
            bytes32 comment = "wow";
            ratingAgency.roundSurveySubmit( _round, a, 0, answers, comment );
            recommendation = 4;
            ratingAgency.roundSurveySubmit( _round, a, 1, answers, comment );
        }
        ratingAgency.roundTally( _round );
    }
    
    function coverToken( uint i ) public {
        address tokenAddr = tokens[ i ];
        ratingAgency.tokenCover( tokenAddr, token_names[i], 0 );
    }
    function uint2str(uint i) internal pure returns (string){
        if (i == 0) return "0";
        uint j = i;
        uint length;
        while (j != 0){
            length++;
            j /= 10;
        }
        bytes memory bstr = new bytes(length);
        uint k = length - 1;
        while (i != 0){
            bstr[k--] = byte(48 + i % 10);
            i /= 10;
        }
        return string(bstr);
    }
}

contract test1 {
    
    struct RoundSurvey {// Round evaluations
        bytes32 answers;  
        byte qualitatives; // yes / no
        uint8 recommendation; // 1-10
        bytes32 comment;
    }
    mapping ( uint8 => RoundSurvey[2] ) evaluations; 
    struct RoundAssessment {
        bytes32 avg_answer;
        uint8 avg_recommendation;
        uint8 sways;
    }
    struct Round {
        mapping ( uint8 => RoundSurvey ) evaluations;  
    }
    
    mapping ( uint16 => Round ) rounds;
    function test(address _ratingAgency) public {

        rounds[0] = Round();  
        rounds[1] = Round();
    }
    
    
    function submitSurvey(uint16 _round, bool _pre, bytes32 _answers, byte _qualitatives, uint8 recommendation, bytes32 comment) {
    
    
    }
    
    
    event showbyte(byte b);
    function bytesToBytes32(bytes b, uint offset) public returns (bytes32) {
        bytes32 out;

        for (uint i = 0; i < 32; i++) {
            showbyte(b[offset+i]);
            out |= bytes32(b[offset + i] & 0xFF) >> (i * 8);
        }
        return out;
    }
    
    function bytes32toUints(bytes32 b) public pure returns (uint8[32] result){
        for (uint i=0; i< 32; i++){
            result[i] = uint8(b[i]);
        }
    }

}

