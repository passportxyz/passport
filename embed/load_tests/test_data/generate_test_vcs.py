#!/usr/bin/env python3
"""
Generate test verifiable credentials (VCs) for load testing the embed service.
This script creates mock VCs for various providers that can be used in load tests.
"""

import json
import os
import uuid
from datetime import datetime, timedelta

def generate_mock_vc(provider, address, issuer="did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK"):
    """
    Generate a mock verifiable credential for testing.
    
    Args:
        provider (str): The provider name (e.g., "Ens", "GitcoinContributorStatistics")
        address (str): The Ethereum address
        issuer (str): The issuer DID
    
    Returns:
        dict: Mock verifiable credential
    """
    now = datetime.utcnow()
    expiration = now + timedelta(days=365)
    
    # Base VC structure
    vc = {
        "@context": [
            "https://www.w3.org/2018/credentials/v1",
            "https://w3id.org/vc-revocation-list-2020/v1"
        ],
        "type": ["VerifiableCredential"],
        "issuer": issuer,
        "issuanceDate": now.isoformat() + "Z",
        "expirationDate": expiration.isoformat() + "Z",
        "credentialSubject": {
            "id": f"did:pkh:eip155:1:{address}",
            "provider": provider,
            "hash": f"v0.0.0:{provider}",
            "address": address
        },
        "proof": {
            "type": "Ed25519Signature2018",
            "proofPurpose": "assertionMethod",
            "verificationMethod": f"{issuer}#key-1",
            "created": now.isoformat() + "Z",
            "jws": f"eyJhbGciOiJFZERTQSIsImNyaXQiOlsiYjY0Il0sImI2NCI6ZmFsc2V9..mock_signature_{uuid.uuid4().hex[:16]}"
        }
    }
    
    # Add provider-specific data
    if provider == "Ens":
        vc["credentialSubject"]["ens"] = f"test-{uuid.uuid4().hex[:8]}.eth"
    elif provider.startswith("GitcoinContributorStatistics"):
        vc["credentialSubject"]["totalContributionAmount"] = "1000.0"
        vc["credentialSubject"]["totalContributionCount"] = 5
    elif provider.startswith("NFTScore"):
        score = provider.split("#")[1] if "#" in provider else "50"
        vc["credentialSubject"]["score"] = int(score)
    elif provider == "SnapshotProposalsProvider":
        vc["credentialSubject"]["proposalCount"] = 3
    elif provider.startswith("zkSyncScore"):
        score = provider.split("#")[1] if "#" in provider else "5"
        vc["credentialSubject"]["score"] = int(score)
    elif provider == "Lens":
        vc["credentialSubject"]["lensHandle"] = f"test-{uuid.uuid4().hex[:8]}.lens"
    elif provider == "GnosisSafe":
        vc["credentialSubject"]["safeAddress"] = address
    
    return vc

def generate_vcs_for_address(address, providers=None):
    """
    Generate a set of VCs for a given address.
    
    Args:
        address (str): The Ethereum address
        providers (list): List of providers to generate VCs for
    
    Returns:
        list: List of verifiable credentials
    """
    if providers is None:
        providers = [
            "Ens",
            "NFTScore#50",
            "NFTScore#75", 
            "NFTScore#90",
            "GitcoinContributorStatistics#totalContributionAmountGte#10",
            "GitcoinContributorStatistics#totalContributionAmountGte#100",
            "GitcoinContributorStatistics#totalContributionAmountGte#1000",
            "SnapshotProposalsProvider",
            "zkSyncScore#5",
            "zkSyncScore#20",
            "zkSyncScore#50",
            "Lens",
            "GnosisSafe"
        ]
    
    vcs = []
    for provider in providers:
        vc = generate_mock_vc(provider, address)
        vcs.append(vc)
    
    return vcs

def main():
    """Main function to generate VCs for all test accounts."""
    # Get configuration
    num_accounts = int(os.getenv('NUM_ACCOUNTS', '100'))
    accounts_file = f"generated_accounts_{num_accounts}.json"
    vcs_dir = "vcs"
    
    # Create VCs directory if it doesn't exist
    os.makedirs(vcs_dir, exist_ok=True)
    
    print(f"Generating VCs for {num_accounts} accounts...")
    
    try:
        # Load accounts
        with open(accounts_file, 'r') as f:
            accounts = json.load(f)
        
        # Generate VCs for each account
        for i, account in enumerate(accounts):
            address = account['address']
            vcs = generate_vcs_for_address(address)
            
            # Save VCs to individual file
            vc_file = os.path.join(vcs_dir, f"{address}_vcs.json")
            with open(vc_file, 'w') as f:
                json.dump(vcs, f, indent=2)
            
            if (i + 1) % 10 == 0:
                print(f"Generated VCs for {i + 1}/{len(accounts)} accounts")
        
        print(f"Successfully generated VCs for {len(accounts)} accounts in {vcs_dir}/")
        
        # Print sample VC for verification
        sample_address = accounts[0]['address']
        sample_vc_file = os.path.join(vcs_dir, f"{sample_address}_vcs.json")
        with open(sample_vc_file, 'r') as f:
            sample_vcs = json.load(f)
        
        print(f"\nSample VC for {sample_address}:")
        print(f"Provider: {sample_vcs[0]['credentialSubject']['provider']}")
        print(f"Subject ID: {sample_vcs[0]['credentialSubject']['id']}")
        
    except Exception as e:
        print(f"Error generating VCs: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())


