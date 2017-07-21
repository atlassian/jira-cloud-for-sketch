//
//  AtlassianURLConnectionDelegate.h
//  AtlassianSketchFramework
//
//  Created by Tim Pettersen on 7/21/17.
//  Copyright © 2017 Atlassian. All rights reserved.
//

#import <Foundation/Foundation.h>

@protocol AtlassianMochaFriendlyURLConnectionDelegate <NSObject>

- (void)bytesSent:(NSString *)arg1 totalBytesSent:(NSString *)arg2 totalBytesExpectedToSend:(NSString *)arg3;
- (void)receivedResponse:(NSURLResponse *)arg1;
- (void)receivedData:(NSData *)arg1;
- (void)failed:(NSError *)arg1;
- (void)completed;

@end

@interface AtlassianURLConnectionDelegate : NSObject <NSURLConnectionDelegate>

@property (readonly, nonatomic, weak) id<AtlassianMochaFriendlyURLConnectionDelegate> delegate;
- (instancetype)initWithDelegate:(id<AtlassianMochaFriendlyURLConnectionDelegate>) delegate NS_DESIGNATED_INITIALIZER;

@end
