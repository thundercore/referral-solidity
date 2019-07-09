# Contributing to Referral Solidity

When contributing to this repository please try and adhere to the following before making a pull request:
- Keep styling and naming conventions consistent with the pre-existing solutions
- Be mindful of gas consumption and highlight high gas costs
- Clearly document the changes or additions
- Avoid using storage for this library and stick to stack or memory storage types
- Ensure that function/variable names don't conflict with instance member attributes or reserverd words

### Example of a good function:

```javascript
    /**
     * My Function Name
     *
     * Describe what your function does
     *
     * @param _base Explain where this value is set e.g. passed in or as part of a "using x for x" statement
     * @param _value Explain the purpose of this value
     * @return uint Explain what you should expect to be returned
     */
    function multiply(uint _base, uint _value) public returns (uint) {
        ...
    }
```

- Clear document block
- Short and clear function name
- No conflicting names
