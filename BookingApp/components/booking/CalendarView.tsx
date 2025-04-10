productionStatusIndicator: {
    width: 4,
    height: '70%',
    borderRadius: 2,
    backgroundColor: '#999',
    marginRight: 12,
  },
  confirmedStatus: {
    backgroundColor: '#2196F3',
  },
  completedStatus: {
    backgroundColor: '#4CAF50',
  },
  cancelledStatus: {
    backgroundColor: '#F44336',
  },
  overtimeStatus: {
    backgroundColor: '#FF9800',
  },
  productionDetails: {
    flex: 1,
  },
  productionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  productionTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  productionVenue: {
    fontSize: 14,
    color: '#666',
  },
  noProductionsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noProductionsText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  }
});

export default CalendarView;