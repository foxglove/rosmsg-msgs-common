# Arrays of different types
bool[3] bool_values
byte[3] byte_values
char[3] char_values
float32[3] float32_values
float64[3] float64_values
int8[3] int8_values
uint8[3] uint8_values
int16[3] int16_values
uint16[3] uint16_values
int32[3] int32_values
uint32[3] uint32_values
int64[3] int64_values
uint64[3] uint64_values
string[3] string_values
BasicTypes[3] basic_types_values
Constants[3] constants_values
Defaults[3] defaults_values
bool[3] bool_values_default [false, true, false]
byte[3] byte_values_default [0, 1, 255]
char[3] char_values_default [0, 1, 127]
float32[3] float32_values_default [1.125, 0.0, -1.125]
float64[3] float64_values_default [3.1415, 0.0, -3.1415]
int8[3] int8_values_default [0, 127, -128]
uint8[3] uint8_values_default [0, 1, 255]
int16[3] int16_values_default [0, 32767, -32768]
uint16[3] uint16_values_default [0, 1, 65535]
int32[3] int32_values_default [0, 2147483647, -2147483648]
uint32[3] uint32_values_default [0, 1, 4294967295]
int64[3] int64_values_default [0, 9223372036854775807, -9223372036854775808]
uint64[3] uint64_values_default [0, 1, 18446744073709551615]
string[3] string_values_default ["", "max value", "min value"]
# Regression test: check alignment of basic field after an array field is correct
int32 alignment_check

================================================================================
MSG: test_msgs/BasicTypes
bool bool_value
byte byte_value
char char_value
float32 float32_value
float64 float64_value
int8 int8_value
uint8 uint8_value
int16 int16_value
uint16 uint16_value
int32 int32_value
uint32 uint32_value
int64 int64_value
uint64 uint64_value

================================================================================
MSG: test_msgs/Constants
bool BOOL_CONST=true
byte BYTE_CONST=50
char CHAR_CONST=100
float32 FLOAT32_CONST=1.125
float64 FLOAT64_CONST=1.125
int8 INT8_CONST=-50
uint8 UINT8_CONST=200
int16 INT16_CONST=-1000
uint16 UINT16_CONST=2000
int32 INT32_CONST=-30000
uint32 UINT32_CONST=60000
int64 INT64_CONST=-40000000
uint64 UINT64_CONST=50000000

================================================================================
MSG: test_msgs/Defaults
bool bool_value true
byte byte_value 50
char char_value 100
float32 float32_value 1.125
float64 float64_value 1.125
int8 int8_value -50
uint8 uint8_value 200
int16 int16_value -1000
uint16 uint16_value 2000
int32 int32_value -30000
uint32 uint32_value 60000
int64 int64_value -40000000
uint64 uint64_value 50000000

