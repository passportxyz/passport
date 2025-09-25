#!/usr/bin/env python3
"""
Generate test Ethereum accounts for load testing the embed service.
This script creates a specified number of test accounts with addresses and private keys.
"""

import json
import os
from eth_account import Account
from mnemonic import Mnemonic

def generate_accounts(num_accounts=100, mnemonic_phrase=None):
    """
    Generate test Ethereum accounts.
    
    Args:
        num_accounts (int): Number of accounts to generate
        mnemonic_phrase (str): Optional mnemonic phrase for deterministic generation
    
    Returns:
        list: List of account dictionaries with address and private_key
    """
    accounts = []
    
    if mnemonic_phrase:
        # Use provided mnemonic for deterministic generation
        mnemo = Mnemonic("english")
        if not mnemo.check(mnemonic_phrase):
            raise ValueError("Invalid mnemonic phrase")
        
        # Generate accounts deterministically from mnemonic
        for i in range(num_accounts):
            # Create a deterministic path for each account
            account = Account.from_mnemonic(mnemonic_phrase, account_path=f"m/44'/60'/0'/0/{i}")
            accounts.append({
                "address": account.address,
                "private_key": account.key.hex()
            })
    else:
        # Generate random accounts
        for i in range(num_accounts):
            account = Account.create()
            accounts.append({
                "address": account.address,
                "private_key": account.key.hex()
            })
    
    return accounts

def main():
    """Main function to generate and save test accounts."""
    # Get configuration from environment variables
    num_accounts = int(os.getenv('NUM_ACCOUNTS', '100'))
    mnemonic_phrase = os.getenv('MNEMONIC')
    output_file = f"generated_accounts_{num_accounts}.json"
    
    print(f"Generating {num_accounts} test accounts...")
    
    try:
        accounts = generate_accounts(num_accounts, mnemonic_phrase)
        
        # Save to JSON file
        with open(output_file, 'w') as f:
            json.dump(accounts, f, indent=2)
        
        print(f"Successfully generated {len(accounts)} accounts and saved to {output_file}")
        
        # Print first few addresses for verification
        print("\nFirst 5 addresses:")
        for i, account in enumerate(accounts[:5]):
            print(f"{i+1}. {account['address']}")
            
    except Exception as e:
        print(f"Error generating accounts: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())


