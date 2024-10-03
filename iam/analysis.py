import pandas as pd
import numpy as np
import plotext as plt

def plot_terminal_friendly(x, y, plot_title, x_label, y_label, plot_type='line'):
    plt.clf()
    if plot_type == 'line':
        plt.plot(x, y)
    elif plot_type == 'scatter':
        plt.scatter(x, y)
    plt.title(plot_title)
    plt.xlabel(x_label)
    plt.ylabel(y_label)
    plt.show()

def plot_box(data, labels, plot_title):
    plt.clf()
    plt.box_plot(data, labels)
    plt.title(plot_title)
    plt.show()

def analyze_trust_changes(merged_data, group_name):
    print(f"\nAnalysis of staking effect on trust for {group_name}:")
    print(f"Average initial trust: {merged_data['initialTrust'].mean():.4f}")
    print(f"Average after-stake trust: {merged_data['afterStakeTrust'].mean():.4f}")
    print(f"Average trust change: {merged_data['trust_change'].mean():.4f}")
    
    positive_changes = (merged_data['trust_change'] > 0).sum()
    negative_changes = (merged_data['trust_change'] < 0).sum()
    no_changes = (merged_data['trust_change'] == 0).sum()
    
    print(f"Number of addresses with positive trust change: {positive_changes}")
    print(f"Number of addresses with negative trust change: {negative_changes}")
    print(f"Number of addresses with no trust change: {no_changes}")
    
    correlation = merged_data['current_amount'].corr(merged_data['trust_change'])
    print(f"Correlation between stake amount and trust change: {correlation:.4f}")

def main():
    # Read the CSV file
    trust_data_results = pd.read_csv('transitive_trust_data.csv')
    staking_amounts = pd.read_json('sample-community-stakes-above-1.json')

    # Filter for addresses with positive MDB score
    positive_mdb_addresses = trust_data_results[trust_data_results['mdbScore'] > 0]['address'].tolist()

    # Filter for addresses with MDB score of 0
    zero_mdb_addresses = trust_data_results[trust_data_results['mdbScore'] == 0]['address'].tolist()

    # Filter staking_amounts for both groups
    filtered_staking_positive = staking_amounts[
        (staking_amounts['staker'].isin(positive_mdb_addresses))
    ]

    filtered_staking_zero = staking_amounts[
        (staking_amounts['staker'].isin(zero_mdb_addresses))
    ]

    # Merge data for both groups
    merged_data_positive = pd.merge(filtered_staking_positive, trust_data_results, left_on='stakee', right_on='address', how='left')
    merged_data_zero = pd.merge(filtered_staking_zero, trust_data_results, left_on='stakee', right_on='address', how='left')

    # Calculate trust changes for both groups
    for df in [merged_data_positive, merged_data_zero]:
        df['trust_change'] = df['afterStakeTrust'] - df['initialTrust']

    # Analyze trust changes for both groups
    analyze_trust_changes(merged_data_positive, "Positive MDB Score Group")
    analyze_trust_changes(merged_data_zero, "Zero MDB Score Group")

    # Terminal-friendly scatter plots
    print("\nScatter plot of stake amount vs trust change (Positive MDB Score):")
    plot_terminal_friendly(merged_data_positive['current_amount'].tolist(), 
                           merged_data_positive['trust_change'].tolist(), 
                           'Stake Amount vs Trust Change (Positive MDB)', 
                           'Stake Amount', 'Trust Change', 'scatter')

    print("\nScatter plot of stake amount vs trust change (Zero MDB Score):")
    plot_terminal_friendly(merged_data_zero['current_amount'].tolist(), 
                           merged_data_zero['trust_change'].tolist(), 
                           'Stake Amount vs Trust Change (Zero MDB)', 
                           'Stake Amount', 'Trust Change', 'scatter')

    # Terminal-friendly box plots
    print("\nBox plot: Initial vs After Stake Trust (Positive MDB)")
    plot_box([merged_data_positive['initialTrust'].tolist(), 
              merged_data_positive['afterStakeTrust'].tolist()],
             ['Initial Trust', 'After Stake Trust'],
             'Initial vs After Stake Trust (Positive MDB)')

    print("\nBox plot: Initial vs After Stake Trust (Zero MDB)")
    plot_box([merged_data_zero['initialTrust'].tolist(), 
              merged_data_zero['afterStakeTrust'].tolist()],
             ['Initial Trust', 'After Stake Trust'],
             'Initial vs After Stake Trust (Zero MDB)')

if __name__ == "__main__":
    main()