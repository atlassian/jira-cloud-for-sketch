//
//  AtlassianURLConnectionDelegate.m
//  AtlassianSketchFramework
//
//  Created by Tim Pettersen on 7/21/17.
//  Copyright © 2017 Atlassian. All rights reserved.
//

#import "AtlassianURLConnectionDelegate.h"

@interface AtlassianURLConnectionDelegate ()

@property (readwrite, nonatomic, weak) id<AtlassianMochaFriendlyURLConnectionDelegate> delegate;

@end

@implementation AtlassianURLConnectionDelegate

- (instancetype)initWithDelegate:(id<AtlassianMochaFriendlyURLConnectionDelegate>) delegate {
    self = [super init];
    self.delegate = delegate;
    return self;
}

- (instancetype)init NS_UNAVAILABLE
{
    return nil;
}

- (void)connection:(NSURLConnection __unused *)connection
   didSendBodyData:(NSInteger)bytesWritten
 totalBytesWritten:(NSInteger)totalBytesWritten
totalBytesExpectedToWrite:(NSInteger)totalBytesExpectedToWrite
{
    NSString *bytesSent = [NSString stringWithFormat: @"%ld", (long) bytesWritten];
    NSString *totalBytesSent = [NSString stringWithFormat: @"%ld", (long) totalBytesWritten];
    NSString *totalBytesExpectedToSend = [NSString stringWithFormat: @"%ld", (long) totalBytesExpectedToWrite];
    [ self.delegate bytesSent:bytesSent totalBytesSent:totalBytesSent totalBytesExpectedToSend:totalBytesExpectedToSend ];
}

- (void)connection:(NSURLConnection __unused *)connection
didReceiveResponse:(NSURLResponse *)response
{
    [ self.delegate receivedResponse:response ];
}

- (void)connection:(NSURLConnection __unused *)connection
    didReceiveData:(NSData *)data
{
    [ self.delegate receivedData:data ];
}

- (void)connectionDidFinishLoading:(NSURLConnection __unused *)connection
{
    [ self.delegate completed ];
}

- (void)connection:(NSURLConnection __unused *)connection
  didFailWithError:(NSError *)error
{
    [ self.delegate failed:error ];
}

@end
